package com.myplunt.ops;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.constants.ApiPaths;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@Profile("staging")
public class DbResetController {

    private final Flyway flyway;
    private final String resetSecret;
    private final AuditLog auditLog;

    public DbResetController(Flyway flyway, @Value("${app.ops.reset-secret}") String resetSecret, AuditLog auditLog) {
        this.flyway = flyway;
        this.resetSecret = resetSecret;
        this.auditLog = auditLog;
    }

    @PostMapping(ApiPaths.Ops.RESET_DB)
    @ResponseStatus(HttpStatus.OK)
    public void resetDb(@RequestHeader("X-Ops-Secret") String providedSecret) {
        if (!secretMatches(providedSecret)) {
            auditLog.rejected(AuditEvent.DATABASE_RESET_REJECTED, null, "wrong_secret", Map.of());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        flyway.clean();
        flyway.migrate();
        // Done with the ops secret, not as a user: there's no user_id or changed_by.
        auditLog.recorded(AuditEvent.DATABASE_RESET, null, null, Map.of());
    }

    private boolean secretMatches(String providedSecret) {
        return MessageDigest.isEqual(
                providedSecret.getBytes(StandardCharsets.UTF_8),
                resetSecret.getBytes(StandardCharsets.UTF_8));
    }
}
