package com.myplunt.common.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.spi.LoggingEventBuilder;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

// Writes what users do to the log file as INFO lines. The ids and numbers go in as separate
// JSON fields (action, userId, plantId, ...) next to the message, so they can be queried
// without parsing text. Never log personal data (emails, names, notes): ids and numbers only.
@Component
public class ActionLog {

    private static final Logger log = LoggerFactory.getLogger(ActionLog.class);

    public void record(UserAction action, UUID userId) {
        record(action, userId, null, Map.of());
    }

    public void record(UserAction action, UUID userId, UUID plantId) {
        record(action, userId, plantId, Map.of());
    }

    public void record(UserAction action, UUID userId, UUID plantId, Map<String, Object> details) {
        LoggingEventBuilder line = log.atInfo()
                .setMessage(action.name())
                .addKeyValue("action", action.name())
                .addKeyValue("userId", userId);
        if (plantId != null) {
            line = line.addKeyValue("plantId", plantId);
        }
        for (Map.Entry<String, Object> detail : details.entrySet()) {
            line = line.addKeyValue(detail.getKey(), detail.getValue());
        }
        line.log();
    }
}
