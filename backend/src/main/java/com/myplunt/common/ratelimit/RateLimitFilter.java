package com.myplunt.common.ratelimit;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.constants.ApiPaths;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.InstantSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Slows down password guessing and sign-up spam on the endpoints that need no token. Runs before security,
// right after RequestIdFilter, so a blocked request never reaches bcrypt.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();
    private static final int MAX_TRACKED_WINDOWS = 10_000;
    // POSTs per client IP per minute: room for typos and a shared network, too few to guess passwords.
    private static final Map<String, Integer> LIMITS = Map.of(
            ApiPaths.Auth.LOGIN, 10,
            ApiPaths.Auth.REGISTER, 5,
            ApiPaths.Auth.REFRESH, 30,
            ApiPaths.Admin.LOGIN, 5);
    private static final String BODY = """
            {"title":"Too Many Requests","status":429,"detail":"Too many attempts. Try again in a minute."}""";

    private record Window(long start, int count) {}

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final InstantSource clock;

    public RateLimitFilter() {
        this(InstantSource.system());
    }

    RateLimitFilter(InstantSource clock) {
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !LIMITS.containsKey(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        long now = clock.millis();
        if (windows.size() > MAX_TRACKED_WINDOWS) {
            windows.values().removeIf(window -> now - window.start() >= WINDOW_MILLIS);
        }
        Window window = windows.compute(request.getRemoteAddr() + " " + path, (key, old) ->
                old == null || now - old.start() >= WINDOW_MILLIS ? new Window(now, 1) : new Window(old.start(), old.count() + 1));

        if (window.count() <= LIMITS.get(path)) {
            chain.doFilter(request, response);
            return;
        }
        // Admin requests are never logged.
        if (!path.startsWith(ApiPaths.Admin.BASE)) {
            StructuredLog.warning(log, LogEvent.RATE_LIMITED, Map.of("method", request.getMethod(), "path", path));
        }
        long retryAfterSeconds = Math.max(1, (window.start() + WINDOW_MILLIS - now + 999) / 1000);
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(BODY);
    }
}
