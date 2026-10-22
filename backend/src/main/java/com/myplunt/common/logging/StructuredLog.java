package com.myplunt.common.logging;

import org.slf4j.Logger;
import org.slf4j.spi.LoggingEventBuilder;

import java.util.Locale;
import java.util.Map;

// Fields are ids, numbers and reasons, never personal data. User actions go through AuditLog.
public final class StructuredLog {

    private StructuredLog() {}

    public static void warning(Logger log, LogEvent event, Map<String, ?> fields) {
        write(log.atWarn(), "warning", event, fields).log();
    }

    public static void error(Logger log, LogEvent event, Throwable cause, Map<String, ?> fields) {
        write(log.atError(), "error", event, fields).setCause(cause).log();
    }

    // Logged at ERROR so it stands out, but typed "bug": nothing failed for the user, the code is wrong.
    public static void bug(Logger log, LogEvent event, Map<String, ?> fields) {
        write(log.atError(), "bug", event, fields).log();
    }

    static String eventName(Enum<?> event) {
        return event.name().toLowerCase(Locale.ROOT);
    }

    static LoggingEventBuilder write(LoggingEventBuilder line, String type, Enum<?> event, Map<String, ?> fields) {
        LoggingEventBuilder built = line.setMessage(eventName(event))
                .addKeyValue("type", type)
                .addKeyValue("event", eventName(event));
        for (Map.Entry<String, ?> field : fields.entrySet()) {
            built = built.addKeyValue(field.getKey(), field.getValue());
        }
        return built;
    }
}
