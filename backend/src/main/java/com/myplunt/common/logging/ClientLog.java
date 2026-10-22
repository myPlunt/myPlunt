package com.myplunt.common.logging;

import com.myplunt.common.logging.dto.ClientLogBatch;
import com.myplunt.common.logging.dto.ClientLogEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.spi.LoggingEventBuilder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.UUID;

// The app can send anything, so these lines are for debugging only, never proof (that's AuditLog).
@Component
public class ClientLog {

    private static final Logger log = LoggerFactory.getLogger(LogLineFormatter.FRONTEND_LOGGER);

    public void record(UUID userId, ClientLogBatch batch) {
        for (ClientLogEntry entry : batch.entries()) {
            LoggingEventBuilder line = switch (entry.type()) {
                case ERROR, BUG -> log.atError();
                case WARNING -> log.atWarn();
                case ACTION, INFO -> log.atInfo();
            };
            line.setMessage(entry.message() != null ? entry.message() : entry.event())
                    .addKeyValue("type", entry.type().name().toLowerCase(Locale.ROOT))
                    .addKeyValue("event", entry.event())
                    .addKeyValue("request_id", entry.requestId())
                    .addKeyValue("client_timestamp", entry.timestamp())
                    .addKeyValue("app_version", batch.appVersion())
                    .addKeyValue("user_id", userId)
                    .addKeyValue("platform", batch.platform())
                    .addKeyValue("os_version", batch.osVersion())
                    .addKeyValue("device_model", batch.deviceModel())
                    .addKeyValue("route", entry.route())
                    .addKeyValue("context", entry.context())
                    .addKeyValue("stack_trace", entry.stackTrace())
                    .log();
        }
    }
}
