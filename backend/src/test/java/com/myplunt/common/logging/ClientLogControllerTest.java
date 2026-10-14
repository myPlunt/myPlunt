package com.myplunt.common.logging;

import com.myplunt.auth.JwtService;
import com.myplunt.common.logging.dto.ClientLogRequest;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(ClientLogController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class ClientLogControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private ClientLog clientLog;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID authenticateAsJane() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        return id;
    }

    private RestTestClient.ResponseSpec report(ClientLogRequest request) {
        return restTestClient.post().uri("/v1/client-logs")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange();
    }

    @Test
    void report_recordsTheErrorForTheSignedInUser() {
        UUID userId = authenticateAsJane();
        ClientLogRequest request = new ClientLogRequest(
                "GET /v1/garden got no response", "TypeError: Network request failed", "android", "1.0.0");

        report(request).expectStatus().isNoContent();

        verify(clientLog).record(userId, request);
    }

    @Test
    void report_acceptsAnErrorWithoutDetailsOrAppVersion() {
        UUID userId = authenticateAsJane();
        ClientLogRequest request = new ClientLogRequest("App crashed", null, "ios", null);

        report(request).expectStatus().isNoContent();

        verify(clientLog).record(userId, request);
    }

    @Test
    void report_rejectsABlankOrTooLongMessage() {
        authenticateAsJane();

        report(new ClientLogRequest(" ", null, "ios", null)).expectStatus().isBadRequest();
        report(new ClientLogRequest("x".repeat(1001), null, "ios", null)).expectStatus().isBadRequest();
        verify(clientLog, never()).record(any(), any());
    }

    @Test
    void report_rejectsTooLongDetails() {
        authenticateAsJane();

        report(new ClientLogRequest("App crashed", "x".repeat(8001), "ios", null))
                .expectStatus().isBadRequest();
        verify(clientLog, never()).record(any(), any());
    }

    @Test
    void report_rejectsAMissingOrUnknownPlatform() {
        authenticateAsJane();

        report(new ClientLogRequest("App crashed", null, null, null)).expectStatus().isBadRequest();
        report(new ClientLogRequest("App crashed", null, "windows", null)).expectStatus().isBadRequest();
        verify(clientLog, never()).record(any(), any());
    }

    @Test
    void report_rejectsATooLongAppVersion() {
        authenticateAsJane();

        report(new ClientLogRequest("App crashed", null, "ios", "1".repeat(33))).expectStatus().isBadRequest();
        verify(clientLog, never()).record(any(), any());
    }

    @Test
    void report_rejectsRequestsWithoutAToken() {
        restTestClient.post().uri("/v1/client-logs")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ClientLogRequest("App crashed", null, "ios", null))
                .exchange()
                .expectStatus().isUnauthorized();
        verify(clientLog, never()).record(any(), any());
    }
}
