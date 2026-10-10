package com.myplunt.species;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.species.dto.SpeciesResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;

@WebMvcTest(SpeciesController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class SpeciesControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private SpeciesService speciesService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void species_returnsTheApprovedSpecies() {
        UUID userId = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", userId);
        when(jwtService.parseAndValidate("access-token")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        List<SpeciesResponse> species =
                List.of(new SpeciesResponse(UUID.randomUUID(), "Monstera", "Monstera deliciosa", 7));
        when(speciesService.getApprovedSpecies()).thenReturn(species);

        restTestClient.get().uri("/v1/species")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(new ParameterizedTypeReference<List<SpeciesResponse>>() {})
                .isEqualTo(species);
    }

    @Test
    void species_rejectsRequestsWithoutAToken() {
        restTestClient.get().uri("/v1/species")
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
