package com.myplunt.common.ratelimit;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private final AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-10-24T10:00:00Z"));
    private final RateLimitFilter filter = new RateLimitFilter(now::get);
    private final Logger logger = (Logger) LoggerFactory.getLogger(RateLimitFilter.class);
    private final ListAppender<ILoggingEvent> logged = new ListAppender<>();

    @BeforeEach
    void captureLogs() {
        logged.start();
        logger.addAppender(logged);
    }

    @AfterEach
    void stopCapturing() {
        logger.detachAppender(logged);
    }

    @Test
    void login_blocksTheEleventhAttemptFromOneIpButNotFromAnother() throws Exception {
        for (int attempt = 0; attempt < 10; attempt++) {
            assertThat(post("10.0.0.1", "/v1/auth/login").getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blocked = post("10.0.0.1", "/v1/auth/login");

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isEqualTo("60");
        assertThat(blocked.getContentAsString()).contains("Too many attempts. Try again in a minute.");
        assertThat(logged.list).hasSize(1);
        assertThat(post("10.0.0.2", "/v1/auth/login").getStatus()).isEqualTo(200);
    }

    @Test
    void login_allowsAttemptsAgainOnceTheMinuteIsOver() throws Exception {
        for (int attempt = 0; attempt < 11; attempt++) {
            post("10.0.0.1", "/v1/auth/login");
        }

        now.set(now.get().plus(Duration.ofMinutes(1)));

        assertThat(post("10.0.0.1", "/v1/auth/login").getStatus()).isEqualTo(200);
    }

    @Test
    void adminLogin_isLimitedWithoutLogging() throws Exception {
        for (int attempt = 0; attempt < 5; attempt++) {
            post("10.0.0.1", "/v1/admin/auth/login");
        }

        assertThat(post("10.0.0.1", "/v1/admin/auth/login").getStatus()).isEqualTo(429);
        assertThat(logged.list).isEmpty();
    }

    private MockHttpServletResponse post(String ip, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr(ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
