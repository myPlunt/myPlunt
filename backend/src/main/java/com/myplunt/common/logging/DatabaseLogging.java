package com.myplunt.common.logging;

import ch.qos.logback.classic.AsyncAppender;
import ch.qos.logback.classic.LoggerContext;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

// Copies the lines that reach the log files into the logs table as well (DatabaseLogAppender).
// Hooked up here rather than in logback-spring.xml because it needs the database, and only once
// the app is ready, when Flyway has created the table: startup lines are only in the files.
@Component
public class DatabaseLogging {

    // The same loggers the files are fed from; audit and frontend don't pass their lines to root.
    private static final List<String> LOGGERS =
            List.of(Logger.ROOT_LOGGER_NAME, AuditLog.AUDIT_LOGGER, LogLineFormatter.FRONTEND_LOGGER);

    private final LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
    private final AsyncAppender async = new AsyncAppender();
    private final DatabaseLogAppender appender;

    public DatabaseLogging(Environment environment, JdbcTemplate jdbc) {
        this.appender = new DatabaseLogAppender(new LogLineFormatter(environment), jdbc);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void attach() {
        appender.setContext(context);
        appender.setName("DATABASE");
        appender.start();

        // The request thread only queues the line. Keep INFO (audit actions) when the queue fills
        // up, but drop lines rather than make requests wait when the database is slow or down.
        async.setContext(context);
        async.setName("ASYNC_DATABASE");
        async.setDiscardingThreshold(0);
        async.setNeverBlock(true);
        async.addAppender(appender);
        LogFileFilter filter = new LogFileFilter();
        filter.start();
        async.addFilter(filter);
        async.start();

        LOGGERS.forEach(name -> context.getLogger(name).addAppender(async));
    }

    // Stops before the database closes, writing out what's still queued. Stopping the async
    // appender also stops DatabaseLogAppender.
    @PreDestroy
    public void detach() {
        LOGGERS.forEach(name -> context.getLogger(name).detachAppender(async));
        async.stop();
    }
}
