package com.myplunt.common.logging;

import com.myplunt.common.logging.dto.ClientLogRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.spi.LoggingEventBuilder;
import org.springframework.stereotype.Component;

import java.util.UUID;

// Writes the errors the app reports into the same log file as the backend's own, as ERROR
// lines with "service":"frontend" so the dashboard can tell the two apart.
@Component
public class ClientLog {

    // Under com.myplunt so LogFileFilter lets it through.
    private static final Logger log = LoggerFactory.getLogger("com.myplunt.frontend");

    public void record(UUID userId, ClientLogRequest request) {
        LoggingEventBuilder line = log.atError()
                .setMessage(request.message())
                .addKeyValue("service", "frontend")
                .addKeyValue("userId", userId)
                .addKeyValue("platform", request.platform());
        if (request.appVersion() != null) {
            line = line.addKeyValue("appVersion", request.appVersion());
        }
        if (request.details() != null) {
            line = line.addKeyValue("details", request.details());
        }
        line.log();
    }
}
