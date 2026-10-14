package com.myplunt.common.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import org.slf4j.event.KeyValuePair;
import org.springframework.core.env.Environment;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

// The shape of every structured log line: one flat JSON object, stored by DatabaseLogAppender.
// Backend lines: {"timestamp","source":"backend","level","type","event","request_id",
// "backend_version","user_id", <the event's fields>, "error":{...}}.
// The app's lines (ClientLog) bring their own type, event, request_id and app_version.
public class LogLineFormatter {

    static final String FRONTEND_LOGGER = "com.myplunt.frontend";

    private final String backendVersion;

    public LogLineFormatter(Environment environment) {
        this.backendVersion = environment.getProperty("app.version", "unknown");
    }

    Map<String, Object> toLine(ILoggingEvent event) {
        boolean frontend = FRONTEND_LOGGER.equals(event.getLoggerName());
        Map<String, Object> fields = new LinkedHashMap<>();
        if (event.getKeyValuePairs() != null) {
            for (KeyValuePair pair : event.getKeyValuePairs()) {
                fields.put(pair.key, pair.value);
            }
        }
        Map<String, String> mdc = event.getMDCPropertyMap();

        Map<String, Object> line = new LinkedHashMap<>();
        line.put("timestamp", event.getInstant().toString());
        line.put("source", frontend ? "frontend" : "backend");
        line.put("level", event.getLevel().toString());
        line.put("type", fields.containsKey("type") ? fields.remove("type") : typeOf(event.getLevel()));
        Object eventName = fields.remove("event");
        line.put("event", eventName != null ? eventName : "unstructured_log");
        // The app's lines carry the id of the request they're about, not of the request that
        // delivered them, so they never fall back to the MDC one.
        line.put("request_id", fields.containsKey("request_id") || frontend ? fields.remove("request_id") : mdc.get("request_id"));
        if (!frontend) {
            line.put("backend_version", backendVersion);
        }
        line.put("user_id", fields.containsKey("user_id") ? fields.remove("user_id") : mdc.get("user_id"));
        if (eventName == null) {
            // A plain log call (ours or a library's): which class wrote it is the only context.
            line.put("logger", event.getLoggerName());
        }
        fields.forEach((key, value) -> line.put(key, jsonValue(value)));
        String message = event.getFormattedMessage();
        if (message != null && !message.equals(eventName)) {
            line.put("message", message);
        }
        IThrowableProxy throwable = event.getThrowableProxy();
        if (throwable != null) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("type", throwable.getClassName());
            error.put("message", throwable.getMessage());
            error.put("stack_trace", ThrowableProxyUtil.asString(throwable));
            line.put("error", error);
        }
        // Fields that don't apply to this line are left out rather than written as null.
        line.values().removeIf(value -> value == null);
        return line;
    }

    private static String typeOf(Level level) {
        if (level.isGreaterOrEqual(Level.ERROR)) {
            return "error";
        }
        if (level.isGreaterOrEqual(Level.WARN)) {
            return "warning";
        }
        return level.isGreaterOrEqual(Level.INFO) ? "info" : "debug";
    }

    // Numbers stay numbers so they can be summed, and lists and maps stay JSON; the rest (ids,
    // instants) becomes text.
    private static Object jsonValue(Object value) {
        if (value == null || value instanceof Number || value instanceof Boolean
                || value instanceof Collection<?> || value instanceof Map<?, ?>) {
            return value;
        }
        return String.valueOf(value);
    }
}
