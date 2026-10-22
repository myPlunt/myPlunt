package com.myplunt.admin;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface AdminRefreshTokenRepository extends JpaRepository<AdminRefreshToken, UUID> {
    Optional<AdminRefreshToken> findByTokenHash(String tokenHash);

    @Transactional
    void deleteByAdminAndExpiresAtBefore(AdminUser admin, Instant cutoff);
}
