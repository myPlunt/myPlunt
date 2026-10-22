package com.myplunt.common.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

// user_id is the account the change is about, changed_by who made it. Old and new values (emails,
// usernames) are logged in full; passwords and tokens never.
@Component
public class AuditLog {

    static final String AUDIT_LOGGER = "com.myplunt.audit";

    private static final Logger log = LoggerFactory.getLogger(AUDIT_LOGGER);

    // Inside a transaction it waits for the commit, so a rolled-back action is never logged.
    public void recorded(AuditEvent event, UUID userId, UUID changedBy, Map<String, ?> details) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("user_id", userId);
        fields.put("changed_by", changedBy);
        fields.putAll(details);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    StructuredLog.write(log.atInfo(), "action", event, fields).log();
                }
            });
        } else {
            StructuredLog.write(log.atInfo(), "action", event, fields).log();
        }
    }

    public void rejected(AuditEvent event, UUID userId, String reason, Map<String, ?> details) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("user_id", userId);
        fields.put("reason", reason);
        fields.putAll(details);
        StructuredLog.write(log.atWarn(), "action", event, fields).log();
    }
}
