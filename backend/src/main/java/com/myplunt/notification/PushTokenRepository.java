package com.myplunt.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PushTokenRepository extends JpaRepository<PushToken, String> {
    List<PushToken> findByUserId(UUID userId);

    void deleteByTokenAndUserId(String token, UUID userId);
}
