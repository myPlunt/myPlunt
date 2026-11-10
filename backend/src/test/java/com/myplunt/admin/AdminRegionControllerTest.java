package com.myplunt.admin;

import com.myplunt.auth.JwtService;
import com.myplunt.config.AdminSecurityConfig;
import com.myplunt.config.SecurityConfig;
import com.myplunt.region.RegionService;
import com.myplunt.region.dto.RegionResponse;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;

@WebMvcTest(AdminRegionController.class)
@AutoConfigureRestTestClient
@Import({SecurityConfig.class, AdminSecurityConfig.class})
@TestPropertySource(properties = "app.admin.allowed-origins=https://admin.myplunt.test")
class AdminRegionControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private RegionService regionService;

    @MockitoBean
    private AdminJwtService adminJwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void regions_returnsTheRegionsWithTheirCountries() {
        UUID id = UUID.randomUUID();
        when(adminJwtService.parseAndValidate("admin-token")).thenReturn(id);
        when(adminUserRepository.findById(id)).thenReturn(Optional.of(new AdminUser("admin@myplunt.dev", "admin", "hashed")));
        when(regionService.getRegions()).thenReturn(List.of(
                new RegionResponse(UUID.randomUUID(), "Balkans", "balkans", "Europe", List.of("Croatia", "Greece"))));

        restTestClient.get().uri("/v1/admin/regions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$[0].parent").isEqualTo("Europe")
                .jsonPath("$[0].countries[1]").isEqualTo("Greece");
    }
}
