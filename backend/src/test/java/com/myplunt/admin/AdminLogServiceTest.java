package com.myplunt.admin;

import com.myplunt.admin.dto.LogOverviewResponse;
import com.myplunt.admin.dto.LogOverviewResponse.Count;
import com.myplunt.admin.dto.LogPageResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

// Runs the aggregate SQL against the real Flyway schema; a mock can't check it.
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(AdminLogService.class)
class AdminLogServiceTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private AdminLogService adminLogService;

    private final Instant now = Instant.now();

    @BeforeEach
    void seed() {
        insert("action", now, "backend", "{\"event\":\"plant_watered\"}");
        insert("action", now, "backend", "{\"event\":\"plant_watered\"}");
        insert("action", now, "frontend", "{\"event\":\"screen_viewed\"}");
        insert("error", now, "backend", "{\"event\":\"unexpected_error\",\"error\":{\"message\":\"boom\"}}");
        // Outside a 7-day overview.
        insert("action", now.minus(30, ChronoUnit.DAYS), "backend", "{\"event\":\"plant_created\"}");
    }

    @Test
    void overview_countsOnlyTheRequestedDaysByLevelAndEvent() {
        LogOverviewResponse overview = adminLogService.overview(7);

        assertThat(overview.total()).isEqualTo(4);
        assertThat(overview.byLevel()).containsExactly(new Count("action", 3), new Count("error", 1));
        assertThat(overview.topActions())
                .extracting("event", "location", "count")
                .containsExactly(tuple("plant_watered", "backend", 2L), tuple("screen_viewed", "frontend", 1L));
        assertThat(overview.topProblems()).extracting("event").containsExactly("unexpected_error");
    }

    @Test
    void entries_filtersAndPagesNewestFirst() {
        LogPageResponse page = adminLogService.entries("error", null, 0, 50);

        assertThat(page.total()).isEqualTo(1);
        assertThat(page.entries().getFirst().message()).isEqualTo("boom");
        assertThat(page.entries().getFirst().details()).contains("\"event\"");

        LogPageResponse all = adminLogService.entries(null, null, 1, 2);
        assertThat(all.total()).isEqualTo(5);
        assertThat(all.entries()).hasSize(2);
    }

    private void insert(String level, Instant at, String location, String details) {
        jdbc.update("INSERT INTO logs (level, logged_at, location, details, raw) VALUES (?, ?, ?, ?::jsonb, ?::json)",
                level, Timestamp.from(at), location, details, details);
    }
}
