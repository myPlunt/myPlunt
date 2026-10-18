package com.myplunt.admin;

import com.myplunt.admin.dto.AdminAuthResponse;
import com.myplunt.admin.dto.AdminLoginRequest;
import com.myplunt.admin.dto.AdminResponse;
import com.myplunt.auth.JwtService;
import com.myplunt.config.AdminSecurityConfig;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.UserRepository;
import io.jsonwebtoken.JwtException;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(AdminAuthController.class)
@AutoConfigureRestTestClient
@Import({SecurityConfig.class, AdminSecurityConfig.class, AdminRefreshCookie.class})
@TestPropertySource(properties = {
        "app.admin.cookie-secure=true",
        "app.admin.allowed-origins=https://admin.myplunt.test"
})
class AdminAuthControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private AdminAuthService adminAuthService;

    @MockitoBean
    private AdminJwtService adminJwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void login_returnsTheAccessTokenAndPutsTheRefreshTokenOnlyInASecureCookie() {
        AdminAuthResponse body = new AdminAuthResponse("access-token", new AdminResponse(UUID.randomUUID(), "admin@myplunt.dev", "admin"));
        when(adminAuthService.login(any())).thenReturn(new AdminSession(body, "refresh-token", Instant.now().plusSeconds(3600)));

        restTestClient.post().uri("/v1/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AdminLoginRequest("admin@myplunt.dev", "correct-password"))
                .exchange()
                .expectStatus().isOk()
                .expectHeader().value(HttpHeaders.SET_COOKIE, cookie -> assertThat(cookie)
                        .startsWith("myplunt_admin_refresh=refresh-token")
                        .contains("HttpOnly", "Secure", "SameSite=Strict", "Path=/v1/admin/auth"))
                .expectBody(String.class).value(json -> assertThat(json)
                        .contains("\"accessToken\":\"access-token\"")
                        .doesNotContain("refresh-token"));
    }

    @Test
    void refresh_readsTheTokenFromTheCookie() {
        AdminAuthResponse body = new AdminAuthResponse("new-access", new AdminResponse(UUID.randomUUID(), "admin@myplunt.dev", "admin"));
        when(adminAuthService.refresh("refresh-token")).thenReturn(new AdminSession(body, "new-refresh", Instant.now().plusSeconds(3600)));

        restTestClient.post().uri("/v1/admin/auth/refresh")
                .cookie(AdminRefreshCookie.NAME, "refresh-token")
                .exchange()
                .expectStatus().isOk();

        verify(adminAuthService).refresh("refresh-token");
    }

    @Test
    void me_rejectsATokenThatIsNotAnAdminToken() {
        when(adminJwtService.parseAndValidate("app-user-token")).thenThrow(new JwtException("wrong audience"));

        restTestClient.get().uri("/v1/admin/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer app-user-token")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void me_returnsTheSignedInAdmin() {
        AdminUser admin = new AdminUser("admin@myplunt.dev", "admin", "hashed");
        UUID id = UUID.randomUUID();
        when(adminJwtService.parseAndValidate("admin-token")).thenReturn(id);
        when(adminUserRepository.findById(id)).thenReturn(java.util.Optional.of(admin));

        restTestClient.get().uri("/v1/admin/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(String.class).value(json -> assertThat(json).contains("\"email\":\"admin@myplunt.dev\""));
    }

    @Test
    void cors_refusesOtherOrigins() {
        restTestClient.options().uri("/v1/admin/auth/login")
                .header(HttpHeaders.ORIGIN, "https://evil.example")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .exchange()
                .expectStatus().isForbidden();
    }
}
