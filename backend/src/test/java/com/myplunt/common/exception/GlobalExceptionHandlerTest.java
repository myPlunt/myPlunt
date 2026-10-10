package com.myplunt.common.exception;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class GlobalExceptionHandlerTest {

    @Test
    void handleUnexpected_logsTheRequestAndStackTraceButReturnsAGenericMessage(CapturedOutput output) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/v1/plants");

        ProblemDetail problem = new GlobalExceptionHandler()
                .handleUnexpected(new RuntimeException("column \"light\" does not exist"), request);

        assertThat(problem.getStatus()).isEqualTo(500);
        assertThat(problem.getDetail()).isEqualTo("An unexpected error occurred");
        assertThat(output).contains("Unhandled exception on POST /v1/plants");
        assertThat(output).contains("column \"light\" does not exist");
    }
}
