package com.myplunt.admin;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

// Not a @Component: Spring Boot would then run it on every request, not just the admin chain.
public class AdminJwtAuthFilter extends OncePerRequestFilter {

    private final AdminJwtService jwtService;
    private final AdminUserRepository adminUserRepository;

    public AdminJwtAuthFilter(AdminJwtService jwtService, AdminUserRepository adminUserRepository) {
        this.jwtService = jwtService;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                UUID adminId = jwtService.parseAndValidate(header.substring(7));
                adminUserRepository.findById(adminId).ifPresent(admin ->
                        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                                admin, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))));
            } catch (JwtException | IllegalArgumentException ignored) {
            }
        }

        filterChain.doFilter(request, response);
    }
}
