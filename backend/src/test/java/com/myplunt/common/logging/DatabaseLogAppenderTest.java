package com.myplunt.common.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.LoggingEvent;
import ch.qos.logback.classic.util.LogbackMDCAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.event.KeyValuePair;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class DatabaseLogAppenderTest {

    private static final Instant LOGGED_AT = Instant.parse("2026-10-14T10:15:30Z");
    private static final String REQUEST_THREAD = "http-nio-8080-exec-1";

    @Mock
    private JdbcTemplate jdbc;

    private final LoggerContext context = new LoggerContext();
    private DatabaseLogAppender appender;

    @BeforeEach
    void setUp() {
        context.setMDCAdapter(new LogbackMDCAdapter());
        appender = new DatabaseLogAppender(new LogLineFormatter(new MockEnvironment().withProperty("app.version", "1.2.0")), jdbc);
        appender.setContext(context);
        appender.start();
    }

    @Test
    void append_splitsBackendLineIntoColumnsAndKeepsTheRestInDetails() {
        LoggingEvent event = event("com.myplunt.plant.PlantService", REQUEST_THREAD, Level.ERROR, "bug", "plant_in_unknown_planter");

        appender.doAppend(event);

        ArgumentCaptor<String> details = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> raw = ArgumentCaptor.forClass(String.class);
        verify(jdbc).update(eq(DatabaseLogAppender.INSERT), eq("bug"), eq(OffsetDateTime.ofInstant(LOGGED_AT, ZoneOffset.UTC)),
                eq("backend"), details.capture(), raw.capture());
        assertThat(details.getValue())
                .contains("\"level\":\"ERROR\"", "\"event\":\"plant_in_unknown_planter\"", "\"backend_version\":\"1.2.0\"")
                .doesNotContain("\"type\"", "\"timestamp\"", "\"source\"");
        assertThat(raw.getValue())
                .startsWith("{\"timestamp\":\"2026-10-14T10:15:30Z\",\"source\":\"backend\",\"level\":\"ERROR\",\"type\":\"bug\"")
                .contains("\"event\":\"plant_in_unknown_planter\"");
    }

    @Test
    void append_storesAppLinesAsFrontend() {
        LoggingEvent event = event(LogLineFormatter.FRONTEND_LOGGER, REQUEST_THREAD, Level.WARN, "warning", "photo_upload_failed");

        appender.doAppend(event);

        verify(jdbc).update(eq(DatabaseLogAppender.INSERT), eq("warning"), any(OffsetDateTime.class),
                eq("frontend"), any(String.class), any(String.class));
    }

    @Test
    void append_skipsLinesLoggedByItsOwnInsert() {
        LoggingEvent event = event("com.zaxxer.hikari.pool.HikariPool", Thread.currentThread().getName(), Level.WARN,
                "warning", "pool_warning");

        appender.doAppend(event);

        verifyNoInteractions(jdbc);
    }

    private LoggingEvent event(String loggerName, String threadName, Level level, String type, String eventName) {
        LoggingEvent event = new LoggingEvent(getClass().getName(), context.getLogger(loggerName), level, eventName, null, null);
        event.setInstant(LOGGED_AT);
        event.setThreadName(threadName);
        event.addKeyValuePair(new KeyValuePair("type", type));
        event.addKeyValuePair(new KeyValuePair("event", eventName));
        return event;
    }
}
