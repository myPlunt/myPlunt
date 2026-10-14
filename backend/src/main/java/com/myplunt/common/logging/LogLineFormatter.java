package com.myplunt.common.logging;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import org.slf4j.event.KeyValuePair;
import org.springframework.boot.json.JsonWriter;
import org.springframework.boot.logging.structured.StructuredLogFormatter;
import org.springframework.core.env.Environment;

import java.util.LinkedHashMap;
import java.util.Map;

// The shape of each line in the log file (set in application.yml): one flat JSON object with
// only what the dashboard needs, instead of a standard format's nested metadata:
// {"timestamp":"...","level":"INFO","service":"backend","message":"...", <key-values>, "error":{...}}
public class LogLineFormatter implements StructuredLogFormatter<ILoggingEvent> {

    private final JsonWriter<Map<String, Object>> writer = JsonWriter.<Map<String, Object>>standard().withNewLineAtEnd();
    private final String service;

    public LogLineFormatter(Environment environment) {
        this.service = environment.getProperty("spring.application.name", "backend");
    }

    @Override
    public String format(ILoggingEvent event) {
        Map<String, Object> line = new LinkedHashMap<>();
        line.put("timestamp", event.getInstant().toString());
        line.put("level", event.getLevel().toString());
        line.put("service", service);
        line.put("message", event.getFormattedMessage());
        // The fields ActionLog adds (action, userId, plantId, streak...).
        if (event.getKeyValuePairs() != null) {
            for (KeyValuePair pair : event.getKeyValuePairs()) {
                // Numbers stay numbers so they can be summed; ids and the rest become text.
                line.put(pair.key, pair.value instanceof Number ? pair.value : String.valueOf(pair.value));
            }
        }
        IThrowableProxy throwable = event.getThrowableProxy();
        if (throwable != null) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("type", throwable.getClassName());
            error.put("message", throwable.getMessage());
            error.put("stackTrace", ThrowableProxyUtil.asString(throwable));
            line.put("error", error);
        }
        return writer.writeToString(line);
    }
}
