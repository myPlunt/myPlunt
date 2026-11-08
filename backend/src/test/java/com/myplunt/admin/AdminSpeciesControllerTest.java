package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.admin.dto.UpdatePendingSpeciesRequest;
import com.myplunt.auth.JwtService;
import com.myplunt.common.exception.NotFoundException;
import com.myplunt.config.AdminSecurityConfig;
import com.myplunt.config.SecurityConfig;
import com.myplunt.species.SpeciesImportService;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(AdminSpeciesController.class)
@AutoConfigureRestTestClient
@Import({SecurityConfig.class, AdminSecurityConfig.class})
@TestPropertySource(properties = "app.admin.allowed-origins=https://admin.myplunt.test")
class AdminSpeciesControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private AdminSpeciesService adminSpeciesService;

    @MockitoBean
    private SpeciesImportService speciesImportService;

    @MockitoBean
    private AdminJwtService adminJwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final UUID speciesId = UUID.randomUUID();

    @Test
    void update_savesTheAdminsCorrections() {
        signedInAdmin();
        var request = new UpdatePendingSpeciesRequest("Europe", 10, "Full shade");
        when(adminSpeciesService.update(speciesId, request)).thenReturn(new PendingSpeciesResponse(
                speciesId, "Silver fir", "Abies alba", "Europe", 10, "Full shade", null, null, Instant.now()));

        restTestClient.put().uri("/v1/admin/species/pending/" + speciesId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.sunlightNeeds").isEqualTo("Full shade");
    }

    @Test
    void update_withWateringOutOfRange_isBadRequestAndChangesNothing() {
        signedInAdmin();

        restTestClient.put().uri("/v1/admin/species/pending/" + speciesId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdatePendingSpeciesRequest("Europe", 0, "Full sun"))
                .exchange()
                .expectStatus().isBadRequest();

        verify(adminSpeciesService, never()).update(any(), any());
    }

    @Test
    void update_ofASpeciesThatIsNotPending_isNotFound() {
        signedInAdmin();
        when(adminSpeciesService.update(eq(speciesId), any())).thenThrow(new NotFoundException("Species not found"));

        restTestClient.put().uri("/v1/admin/species/pending/" + speciesId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdatePendingSpeciesRequest("Europe", 7, "Full sun"))
                .exchange()
                .expectStatus().isNotFound();
    }

    private void signedInAdmin() {
        UUID id = UUID.randomUUID();
        when(adminJwtService.parseAndValidate("admin-token")).thenReturn(id);
        when(adminUserRepository.findById(id)).thenReturn(Optional.of(new AdminUser("admin@myplunt.dev", "admin", "hashed")));
    }
}
