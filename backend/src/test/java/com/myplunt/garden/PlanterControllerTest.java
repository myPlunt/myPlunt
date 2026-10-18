package com.myplunt.garden;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.garden.dto.CreatePlanterRequest;
import com.myplunt.garden.dto.PlanterResponse;
import com.myplunt.garden.dto.UpdatePlanterRequest;
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

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(PlanterController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class PlanterControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private PlanterService planterService;

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

    private RestTestClient.ResponseSpec post(Object body) {
        return restTestClient.post().uri("/v1/planters")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange();
    }

    @Test
    void create_returnsTheCreatedPlanterForTheSignedInUser() {
        UUID ownerId = authenticateAsJane();
        UUID planterId = UUID.randomUUID();
        when(planterService.create(eq(ownerId), eq(new CreatePlanterRequest("Balcony"))))
                .thenReturn(new PlanterResponse(planterId, "Balcony"));

        post(new CreatePlanterRequest("  Balcony  "))
                .expectStatus().isCreated()
                .expectBody(PlanterResponse.class)
                .isEqualTo(new PlanterResponse(planterId, "Balcony"));
    }

    @Test
    void create_rejectsBlankName() {
        authenticateAsJane();

        post("{\"name\": \"   \"}").expectStatus().isBadRequest();
        verify(planterService, never()).create(any(), any());
    }

    @Test
    void create_returnsConflictForADuplicateName() {
        authenticateAsJane();
        when(planterService.create(any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "You already have a planter called Balcony"));

        post(new CreatePlanterRequest("Balcony")).expectStatus().isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void rename_returnsTheRenamedPlanter() {
        UUID ownerId = authenticateAsJane();
        UUID planterId = UUID.randomUUID();
        when(planterService.rename(ownerId, planterId, new UpdatePlanterRequest("Kitchen")))
                .thenReturn(new PlanterResponse(planterId, "Kitchen"));

        restTestClient.put().uri("/v1/planters/{planterId}", planterId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdatePlanterRequest("Kitchen"))
                .exchange()
                .expectStatus().isOk()
                .expectBody(PlanterResponse.class)
                .isEqualTo(new PlanterResponse(planterId, "Kitchen"));
    }

    @Test
    void delete_returnsNoContentAndDeletesTheSignedInUsersPlanter() {
        UUID ownerId = authenticateAsJane();
        UUID planterId = UUID.randomUUID();

        restTestClient.delete().uri("/v1/planters/{planterId}", planterId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();
        verify(planterService).delete(ownerId, planterId);
    }

    @Test
    void delete_returnsNotFoundForAnUnknownPlanter() {
        authenticateAsJane();
        doThrow(new IllegalStateException("Planter not found")).when(planterService).delete(any(), any());

        restTestClient.delete().uri("/v1/planters/{planterId}", UUID.randomUUID())
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNotFound();
    }
}
