package com.myplunt.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// Created once: restarting with another ADMIN_BOOTSTRAP_PASSWORD doesn't change an existing admin's.
@Component
public class AdminBootstrap implements ApplicationRunner {

    static final int MIN_PASSWORD_LENGTH = 12;

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminBootstrap(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.bootstrap.email}") String email,
            @Value("${app.admin.bootstrap.password}") String password) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.strip();
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (email.isEmpty() || adminUserRepository.findByEmail(email).isPresent()) {
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                    "ADMIN_BOOTSTRAP_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters.");
        }
        adminUserRepository.save(new AdminUser(email, email.split("@")[0], passwordEncoder.encode(password)));
    }
}
