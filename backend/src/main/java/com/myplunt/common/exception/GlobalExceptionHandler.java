package com.myplunt.common.exception;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.constants.ApiPaths;
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

// Logs every error answer, never the submitted values (they can be passwords). Requests from the
// admin dashboard (/v1/admin/**) aren't logged at all.
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
        if (!fromAdmin(request)) {
            Map<String, Object> fields = requestFields(request);
            fields.put("fields", errors.keySet().stream().toList());
            StructuredLog.warning(log, LogEvent.REQUEST_VALIDATION_FAILED, fields);
        }

        return ResponseEntity.status(status).headers(headers).body(problem);
    }

    // A ResponseStatusException's detail is user-safe, so it's logged; other messages can quote the
    // submitted value, so only their kind is.
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        if (fromAdmin(request)) {
            return super.handleExceptionInternal(ex, body, headers, statusCode, request);
        }
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

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex, HttpServletRequest request) {
        if (!fromAdmin(request)) {
            Map<String, Object> fields = requestFields(request);
            fields.put("reason", ex.getMessage());
            StructuredLog.warning(log, LogEvent.RESOURCE_NOT_FOUND, fields);
        }
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest request) {
        if (!fromAdmin(request)) {
            StructuredLog.error(log, LogEvent.UNHANDLED_EXCEPTION, ex, requestFields(request));
        }
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    private static boolean fromAdmin(WebRequest request) {
        return fromAdmin(((ServletWebRequest) request).getRequest());
    }

    private static boolean fromAdmin(HttpServletRequest request) {
        return request.getRequestURI().startsWith(ApiPaths.Admin.BASE + "/");
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
