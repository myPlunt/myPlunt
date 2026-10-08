package com.myplunt.auth;

import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private JwtAuthFilter filter() {
        return new JwtAuthFilter(jwtService, userRepository);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void setsAuthenticationWhenTokenValid() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtService.parseAndValidate("valid-token")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        filter().doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal()).isEqualTo(user);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void leavesUnauthenticatedWhenHeaderMissing() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter().doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void leavesUnauthenticatedWhenHeaderNotBearer() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Basic abc123");

        filter().doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void leavesUnauthenticatedWhenTokenExpired() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer expired-token");
        when(jwtService.parseAndValidate("expired-token")).thenThrow(new ExpiredJwtException(null, null, "expired"));

        filter().doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void leavesUnauthenticatedWhenUserNotFound() throws Exception {
        UUID userId = UUID.randomUUID();
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtService.parseAndValidate("valid-token")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        filter().doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
