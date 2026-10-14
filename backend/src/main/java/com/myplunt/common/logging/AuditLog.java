package com.myplunt.common.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

// The record of what happened to accounts and their data, written to audit.log (see
// logback-spring.xml). It's the source of truth, so services call it whatever the request came
// from. user_id is the account the change is about and changed_by who made it; they differ when
// someone acts on another account. Old and new values (emails, usernames) are logged in full;
// passwords and tokens never go in.
@Component
public class AuditLog {

    static final String AUDIT_LOGGER = "com.myplunt.audit";

    private static final Logger log = LoggerFactory.getLogger(AUDIT_LOGGER);

    // Inside a transaction the line waits for the commit, so a rollback never leaves an action
    // in the log that didn't happen.
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

    // Turned away with the server-side reason. Nothing was saved, so it's written right away.
    // userId is null when the request didn't get as far as an account (e.g. an unknown email).
    public void rejected(AuditEvent event, UUID userId, String reason, Map<String, ?> details) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("user_id", userId);
        fields.put("reason", reason);
        fields.putAll(details);
        StructuredLog.write(log.atWarn(), "action", event, fields).log();
    }
}
