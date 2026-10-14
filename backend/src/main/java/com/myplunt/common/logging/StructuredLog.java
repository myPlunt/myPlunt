package com.myplunt.common.logging;

import org.slf4j.Logger;
import org.slf4j.spi.LoggingEventBuilder;

import java.util.Locale;
import java.util.Map;

// Writes warnings, errors and bugs as structured lines: a "type" and an "event" plus their own
// fields, which LogLineFormatter turns into one JSON object. Fields are ids, numbers and reasons;
<<<<<<< HEAD
// never personal data (mask it with LogMasking first). Actions go through AuditLog instead.
=======
// never personal data. Actions go through AuditLog instead.
>>>>>>> origin/dev
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
