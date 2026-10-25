package com.myplunt.care;

import com.myplunt.auth.JwtService;
import com.myplunt.care.dto.SendCareRequest;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@WebMvcTest(CareRequestController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class CareRequestControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private CareRequestService careRequestService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID authenticateAsRafael() {
        UUID id = UUID.randomUUID();
        User user = new User("rafael", "rafael@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        return id;
    }

    private RestTestClient.ResponseSpec post(Object body) {
        return restTestClient.post().uri("/v1/care-requests")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange();
    }

    @Test
    void send_sendsItFromTheSignedInUser() {
        UUID rafaelId = authenticateAsRafael();
        SendCareRequest request = new SendCareRequest(
                UUID.randomUUID(), Instant.parse("2026-11-07T00:00:00Z"), Instant.parse("2026-11-16T00:00:00Z"));

        post(request).expectStatus().isNoContent();
        verify(careRequestService).send(rafaelId, request);
    }

    @Test
    void send_returnsFieldErrorsForAMissingSitter() {
        authenticateAsRafael();

        post(Map.of("from", "2026-11-07T00:00:00Z", "until", "2026-11-16T00:00:00Z"))
                .expectStatus().isBadRequest()
                .expectBody().jsonPath("$.errors.sitterId").isEqualTo("Sitter must not be empty.");
        verifyNoInteractions(careRequestService);
    }

    @Test
    void send_passesOnAConflict() {
        UUID rafaelId = authenticateAsRafael();
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "You already asked this friend"))
                .when(careRequestService).send(eq(rafaelId), any());

        post(new SendCareRequest(UUID.randomUUID(), Instant.parse("2026-11-07T00:00:00Z"), Instant.parse("2026-11-16T00:00:00Z")))
                .expectStatus().isEqualTo(HttpStatus.CONFLICT)
                .expectBody().jsonPath("$.detail").isEqualTo("You already asked this friend");
    }
}
