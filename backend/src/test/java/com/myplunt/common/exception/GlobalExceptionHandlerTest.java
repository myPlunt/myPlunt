package com.myplunt.common.exception;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final Logger logger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
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
    void handleUnexpected_returnsAGenericMessageWithoutTheCause() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/v1/plants");

        ProblemDetail problem = new GlobalExceptionHandler()
                .handleUnexpected(new RuntimeException("column \"light\" does not exist"), request);

        assertThat(problem.getStatus()).isEqualTo(500);
        assertThat(problem.getDetail()).isEqualTo("An unexpected error occurred");
        assertThat(logged.list).hasSize(1);
    }

    @Test
    void handleUnexpected_logsNothingForTheAdminDashboard() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v1/admin/me");

        ProblemDetail problem = new GlobalExceptionHandler().handleUnexpected(new RuntimeException("boom"), request);

        assertThat(problem.getStatus()).isEqualTo(500);
        assertThat(logged.list).isEmpty();
    }
}
