package com.myplunt.common.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    @Test
    void handleUnexpected_returnsAGenericMessageWithoutTheCause() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/v1/plants");

        ProblemDetail problem = new GlobalExceptionHandler()
                .handleUnexpected(new RuntimeException("column \"light\" does not exist"), request);

        assertThat(problem.getStatus()).isEqualTo(500);
        assertThat(problem.getDetail()).isEqualTo("An unexpected error occurred");
    }
}
