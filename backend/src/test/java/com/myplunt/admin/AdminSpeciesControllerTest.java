package com.myplunt.admin;

import com.myplunt.admin.dto.UpdateSpeciesRequest;
import com.myplunt.auth.JwtService;
import com.myplunt.common.exception.NotFoundException;
import com.myplunt.config.AdminSecurityConfig;
import com.myplunt.config.SecurityConfig;
import com.myplunt.species.dto.SpeciesResponse;
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
    private AdminJwtService adminJwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final UUID speciesId = UUID.randomUUID();
    private final String body = """
            {"commonName":"Olive tree","scientificName":"Olea europaea","region":"Mediterranean",
             "wateringFrequencyDays":10,"sunlightNeeds":"Full sun","common":true}""";

    @Test
    void update_returnsTheEditedSpecies() {
        signedInAdmin();
        UpdateSpeciesRequest request = new UpdateSpeciesRequest("Olive tree", "Olea europaea", "Mediterranean", 10, "Full sun", true);
        when(adminSpeciesService.update(speciesId, request)).thenReturn(new SpeciesResponse(
                speciesId, "Olive tree", "Olea europaea", 10, "Mediterranean", "Full sun", true, null));

        put(body).expectStatus().isOk()
                .expectBody().jsonPath("$.scientificName").isEqualTo("Olea europaea");
    }

    @Test
    void update_withABlankName_isABadRequest() {
        signedInAdmin();

        put(body.replace("\"Olive tree\"", "\" \"")).expectStatus().isBadRequest();

        verify(adminSpeciesService, never()).update(any(), any());
    }

    @Test
    void update_ofASpeciesThatIsNotApproved_isNotFound() {
        signedInAdmin();
        when(adminSpeciesService.update(eq(speciesId), any())).thenThrow(new NotFoundException("Species not found"));

        put(body).expectStatus().isNotFound();
    }

    private RestTestClient.ResponseSpec put(String json) {
        return restTestClient.put().uri("/v1/admin/species/" + speciesId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(json)
                .exchange();
    }

    private void signedInAdmin() {
        UUID id = UUID.randomUUID();
        when(adminJwtService.parseAndValidate("admin-token")).thenReturn(id);
        when(adminUserRepository.findById(id)).thenReturn(Optional.of(new AdminUser("admin@myplunt.dev", "admin", "hashed")));
    }
}
