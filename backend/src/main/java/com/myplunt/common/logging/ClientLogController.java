package com.myplunt.common.logging;

import com.myplunt.common.logging.dto.ClientLogRequest;
import com.myplunt.constants.ApiPaths;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Signed-in only, so nobody can flood the log file anonymously. Errors from before login
// (the login screen itself) aren't reported.
@RestController
public class ClientLogController {

    private final ClientLog clientLog;

    public ClientLogController(ClientLog clientLog) {
        this.clientLog = clientLog;
    }

    @PostMapping(ApiPaths.ClientLogs.BASE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void report(@AuthenticationPrincipal User principal, @Valid @RequestBody ClientLogRequest request) {
        clientLog.record(principal.getId(), request);
    }
}
