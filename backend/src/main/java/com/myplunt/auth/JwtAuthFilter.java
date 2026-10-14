package com.myplunt.auth;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                UUID userId = jwtService.parseAndValidate(header.substring(7));
                userRepository.findById(userId).ifPresent(this::authenticate);
            } catch (ExpiredJwtException ignored) {
                // Normal every 15 minutes: the app refreshes and retries. Spring Security's
                // authorization rules decide what happens to this request.
            } catch (JwtException | IllegalArgumentException e) {
                // A token we didn't sign, or a mangled one: worth knowing about, never logged itself.
                StructuredLog.warning(log, LogEvent.INVALID_TOKEN, Map.of(
                        "reason", e.getClass().getSimpleName(),
                        "method", request.getMethod(),
                        "path", request.getRequestURI()));
            }
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(User user) {
        // Every log line of this request names who made it (RequestIdFilter clears it after).
        MDC.put("user_id", user.getId().toString());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, List.of()));
    }
}
