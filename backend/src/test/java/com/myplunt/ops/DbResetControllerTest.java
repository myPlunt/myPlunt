package com.myplunt.ops;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.UserRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@WebMvcTest(DbResetController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
@ActiveProfiles("staging")
@TestPropertySource(properties = "app.ops.reset-secret=test-secret")
class DbResetControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private Flyway flyway;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void resetDb_withCorrectSecret_cleansAndMigrates() {
        restTestClient.post().uri("/v1/ops/reset-db")
                .header("X-Ops-Secret", "test-secret")
                .exchange()
                .expectStatus().isOk();

        verify(flyway).clean();
        verify(flyway).migrate();
    }

    @Test
    void resetDb_withWrongSecret_isUnauthorizedAndSkipsReset() {
        restTestClient.post().uri("/v1/ops/reset-db")
                .header("X-Ops-Secret", "nope")
                .exchange()
                .expectStatus().isUnauthorized();

        verify(flyway, never()).clean();
    }
}
