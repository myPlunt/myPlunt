package com.myplunt.common.logging;

import ch.qos.logback.classic.AsyncAppender;
import ch.qos.logback.classic.LoggerContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.SmartLifecycle;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

// Sends the structured log lines to the logs table (DatabaseLogAppender). Hooked up here rather
// than in logback-spring.xml because it needs the database: it starts once every bean is ready
// (so Flyway has created the table) but before the web server takes requests. Lines from earlier
// in startup are only on the console.
@Component
public class DatabaseLogging implements SmartLifecycle {

    // Audit and frontend don't pass their lines to root (logback-spring.xml), so each is attached.
    private static final List<String> LOGGERS =
            List.of(Logger.ROOT_LOGGER_NAME, AuditLog.AUDIT_LOGGER, LogLineFormatter.FRONTEND_LOGGER);

    private final LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
    private final AsyncAppender async = new AsyncAppender();
    private final DatabaseLogAppender appender;

    public DatabaseLogging(Environment environment, JdbcTemplate jdbc) {
        this.appender = new DatabaseLogAppender(new LogLineFormatter(environment), jdbc);
    }

    @Override
    public void start() {
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
        LogTableFilter filter = new LogTableFilter();
        filter.start();
        async.addFilter(filter);
        async.start();

        LOGGERS.forEach(name -> context.getLogger(name).addAppender(async));
    }

    // Runs after the web server has stopped taking requests and before the database closes,
    // writing out what's still queued. Stopping the async appender also stops DatabaseLogAppender.
    @Override
    public void stop() {
        LOGGERS.forEach(name -> context.getLogger(name).detachAppender(async));
        async.stop();
    }

    @Override
    public boolean isRunning() {
        return async.isStarted();
    }

    // Lower phases start first and stop last; the web server's phase is close to Integer.MAX_VALUE.
    @Override
    public int getPhase() {
        return 0;
    }
}
