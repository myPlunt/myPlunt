package com.myplunt.common.logging;

import com.myplunt.common.logging.dto.ClientLogBatch;
import com.myplunt.constants.ApiPaths;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Takes the app's log lines (ClientLog). Signed-in only, so nobody can fill the disk
// anonymously; the app keeps what it logs before login and sends it once the user signs in.
@RestController
public class ClientLogController {

    private final ClientLog clientLog;

    public ClientLogController(ClientLog clientLog) {
        this.clientLog = clientLog;
    }

    @PostMapping(ApiPaths.ClientLogs.BASE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void report(@AuthenticationPrincipal User principal, @Valid @RequestBody ClientLogBatch batch) {
        clientLog.record(principal.getId(), batch);
    }
}
