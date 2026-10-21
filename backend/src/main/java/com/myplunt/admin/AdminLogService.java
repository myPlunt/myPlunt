package com.myplunt.admin;

import com.myplunt.admin.dto.LogEntryResponse;
import com.myplunt.admin.dto.LogOverviewResponse;
import com.myplunt.admin.dto.LogOverviewResponse.Count;
import com.myplunt.admin.dto.LogOverviewResponse.DayCount;
import com.myplunt.admin.dto.LogOverviewResponse.EventCount;
import com.myplunt.admin.dto.LogPageResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

// Reads the logs table (V10) for the dashboard. Plain SQL: the table has no entity, it's written
// by DatabaseLogAppender. The admin app only logs species approvals and rejections (see CLAUDE.md).
@Service
public class AdminLogService {

    static final int MAX_DAYS = 90;
    static final int MAX_PAGE_SIZE = 100;
    private static final int TOP_ACTIONS = 15;
    private static final int TOP_PROBLEMS = 10;

    private static final RowMapper<Count> COUNT = (rs, row) -> new Count(rs.getString(1), rs.getLong(2));
    private static final RowMapper<EventCount> EVENT_COUNT = (rs, row) -> new EventCount(
            rs.getString("event"), rs.getString("level"), rs.getString("location"),
            rs.getLong("count"), rs.getTimestamp("last_seen").toInstant());

    private final JdbcTemplate jdbc;

    public AdminLogService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public LogOverviewResponse overview(int days) {
        int range = Math.clamp(days, 1, MAX_DAYS);
        // From the start of the first day, so every day in the chart is a whole day.
        Timestamp since = Timestamp.from(LocalDate.now(ZoneOffset.UTC).minusDays(range - 1L)
                .atStartOfDay(ZoneOffset.UTC).toInstant());

        List<Count> byLevel = jdbc.query(
                "SELECT level, count(*) FROM logs WHERE logged_at >= ? GROUP BY level ORDER BY 2 DESC", COUNT, since);
        List<Count> byLocation = jdbc.query(
                "SELECT location, count(*) FROM logs WHERE logged_at >= ? GROUP BY location ORDER BY 2 DESC", COUNT, since);
        List<DayCount> perDay = jdbc.query("""
                SELECT (logged_at AT TIME ZONE 'UTC')::date AS day, level, count(*)
                FROM logs WHERE logged_at >= ? GROUP BY 1, 2 ORDER BY 1""",
                (rs, row) -> new DayCount(rs.getObject("day", LocalDate.class), rs.getString("level"), rs.getLong(3)),
                since);
        // Screen views are logged on every navigation and would fill the whole chart.
        List<EventCount> topActions = jdbc.query(
                eventCounts("level = 'action' AND details->>'event' IS DISTINCT FROM 'screen_viewed'"),
                EVENT_COUNT, since, TOP_ACTIONS);
        List<EventCount> topProblems = jdbc.query(
                eventCounts("level IN ('error', 'bug', 'warning')"), EVENT_COUNT, since, TOP_PROBLEMS);

        long total = byLevel.stream().mapToLong(Count::count).sum();
        return new LogOverviewResponse(range, total, byLevel, byLocation, perDay, topActions, topProblems);
    }

    // Errors and bugs in the last hour, and how many an hour is usual (the 7 days before it), for
    // the Overview's error spike alert.
    public ErrorRate errorRate() {
        return jdbc.queryForObject("""
                SELECT count(*) FILTER (WHERE logged_at >= now() - interval '1 hour'),
                       count(*) FILTER (WHERE logged_at < now() - interval '1 hour') / (7 * 24.0)
                FROM logs WHERE level IN ('error', 'bug') AND logged_at >= now() - interval '7 days 1 hour'""",
                (rs, row) -> new ErrorRate(rs.getLong(1), rs.getDouble(2)));
    }

    public record ErrorRate(long lastHour, double usualPerHour) {}

    // Newest first. level and location are optional filters; both are bound, never concatenated.
    public LogPageResponse entries(String level, String location, int page, int size) {
        int pageSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int pageIndex = Math.max(page, 0);
        StringBuilder where = new StringBuilder(" WHERE true");
        List<Object> args = new ArrayList<>();
        if (level != null && !level.isBlank()) {
            where.append(" AND level = ?");
            args.add(level);
        }
        if (location != null && !location.isBlank()) {
            where.append(" AND location = ?");
            args.add(location);
        }

        Long total = jdbc.queryForObject("SELECT count(*) FROM logs" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(pageSize);
        pageArgs.add((long) pageIndex * pageSize);
        List<LogEntryResponse> entries = jdbc.query("""
                SELECT id, level, logged_at, location, details->>'event' AS event,
                       coalesce(details->>'message', details->'error'->>'message') AS message, details::text AS details
                FROM logs""" + where + " ORDER BY logged_at DESC, id DESC LIMIT ? OFFSET ?",
                (rs, row) -> new LogEntryResponse(rs.getLong("id"), rs.getString("level"),
                        rs.getTimestamp("logged_at").toInstant(), rs.getString("location"), rs.getString("event"),
                        rs.getString("message"), rs.getString("details")),
                pageArgs.toArray());
        return new LogPageResponse(entries, total == null ? 0 : total, pageIndex, pageSize);
    }

    private static String eventCounts(String levelFilter) {
        return """
                SELECT details->>'event' AS event, level, location, count(*) AS count, max(logged_at) AS last_seen
                FROM logs WHERE logged_at >= ? AND %s
                GROUP BY 1, 2, 3 ORDER BY count DESC, last_seen DESC LIMIT ?""".formatted(levelFilter);
    }
}
