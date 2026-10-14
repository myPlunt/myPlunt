package com.myplunt.common.exception;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;

// Every request that ends in an error answer is logged here with the server-side reason, as a
// warning when the client was turned away (4xx) and an error when we failed (5xx). Never the
// submitted values: they can be passwords.
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation failed");

        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        problem.setProperty("errors", errors);
        Map<String, Object> fields = requestFields(request);
        fields.put("fields", errors.keySet().stream().toList());
        StructuredLog.warning(log, LogEvent.REQUEST_VALIDATION_FAILED, fields);

        return ResponseEntity.status(status).headers(headers).body(problem);
    }

    // Every other error answer Spring builds (ResponseStatusException, broken JSON, a wrong
    // method or query parameter) passes through here. A ResponseStatusException's detail is
    // user-safe by convention, so it's logged as the reason; for the rest only the kind of
    // problem is, since their messages can quote the submitted value.
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        Map<String, Object> fields = requestFields(request);
        fields.put("status", statusCode.value());
        fields.put("reason", ex instanceof ResponseStatusException rse ? rse.getReason() : ex.getClass().getSimpleName());
        if (statusCode.is5xxServerError()) {
            StructuredLog.error(log, LogEvent.UNHANDLED_EXCEPTION, ex, fields);
        } else if (ex instanceof HttpMessageNotReadableException) {
            StructuredLog.warning(log, LogEvent.REQUEST_UNREADABLE, fields);
        } else {
            StructuredLog.warning(log, LogEvent.REQUEST_REJECTED, fields);
        }
        return super.handleExceptionInternal(ex, body, headers, statusCode, request);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleIllegalState(IllegalStateException ex, HttpServletRequest request) {
        Map<String, Object> fields = requestFields(request);
        fields.put("reason", ex.getMessage());
        StructuredLog.warning(log, LogEvent.RESOURCE_NOT_FOUND, fields);
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    // The client only gets a generic message, so the stack trace has to end up in
    // the log or the cause is lost.
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
        StructuredLog.error(log, LogEvent.UNHANDLED_EXCEPTION, ex, requestFields(request));
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private static Map<String, Object> requestFields(WebRequest request) {
        return requestFields(((ServletWebRequest) request).getRequest());
    }

    private static Map<String, Object> requestFields(HttpServletRequest request) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("method", request.getMethod());
        fields.put("path", request.getRequestURI());
        return fields;
    }
}
