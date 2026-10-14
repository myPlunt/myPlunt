package com.myplunt.common.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.UnsynchronizedAppenderBase;
import org.springframework.boot.json.JsonWriter;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;

// Writes each log line to the logs table (V10): its type, time and source get their own columns,
// the rest goes in details, and the whole line in raw. Runs behind an AsyncAppender
// (DatabaseLogging), so it's on its own thread, never inside the caller's transaction.
public class DatabaseLogAppender extends UnsynchronizedAppenderBase<ILoggingEvent> {

    static final String INSERT = "INSERT INTO logs (level, logged_at, location, details, raw) VALUES (?, ?, ?, ?::jsonb, ?::json)";

    private final JsonWriter<Map<String, Object>> writer = JsonWriter.standard();
    private final LogLineFormatter formatter;
    private final JdbcTemplate jdbc;

    public DatabaseLogAppender(LogLineFormatter formatter, JdbcTemplate jdbc) {
        this.formatter = formatter;
        this.jdbc = jdbc;
    }

    @Override
    protected void append(ILoggingEvent event) {
        // A line logged on this thread came from the insert itself (the driver, the pool). Writing
        // it to the table could fail the same way and loop, so it's only in the files.
        if (Thread.currentThread().getName().equals(event.getThreadName())) {
            return;
        }
        Map<String, Object> line = formatter.toLine(event);
        Map<String, Object> details = new LinkedHashMap<>(line);
        Object level = details.remove("type");
        details.remove("timestamp");
        Object location = details.remove("source");
        try {
            jdbc.update(INSERT, String.valueOf(level), OffsetDateTime.ofInstant(event.getInstant(), ZoneOffset.UTC),
                    String.valueOf(location), writer.writeToString(details), writer.writeToString(line));
        } catch (DataAccessException e) {
            // Not logged through SLF4J, which would come back here; the line is still in the files.
            addError("Could not write a log line to the logs table", e);
        }
    }
}
