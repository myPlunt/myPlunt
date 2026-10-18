package com.myplunt.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// There's no admin sign-up, so the first admin comes from ADMIN_BOOTSTRAP_EMAIL and
// ADMIN_BOOTSTRAP_PASSWORD. Created once: if that admin exists, nothing changes, so the password
// can't be reset by restarting with another one. Unset (the default), nothing happens.
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
        // Stops the backend from starting rather than create an admin with a weak password.
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                    "ADMIN_BOOTSTRAP_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters.");
        }
        adminUserRepository.save(new AdminUser(email, email.split("@")[0], passwordEncoder.encode(password)));
    }
}
