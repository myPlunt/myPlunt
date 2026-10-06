package com.myplunt.ops;

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

@RestController
@Profile("staging")
public class DbResetController {

    private final Flyway flyway;
    private final String resetSecret;

    public DbResetController(Flyway flyway, @Value("${app.ops.reset-secret}") String resetSecret) {
        this.flyway = flyway;
        this.resetSecret = resetSecret;
    }

    @PostMapping(ApiPaths.Ops.RESET_DB)
    @ResponseStatus(HttpStatus.OK)
    public void resetDb(@RequestHeader("X-Ops-Secret") String providedSecret) {
        if (!secretMatches(providedSecret)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        flyway.clean();
        flyway.migrate();
    }

    private boolean secretMatches(String providedSecret) {
        return MessageDigest.isEqual(
                providedSecret.getBytes(StandardCharsets.UTF_8),
                resetSecret.getBytes(StandardCharsets.UTF_8));
    }
}
