package com.myplunt.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PushTokenRepository extends JpaRepository<PushToken, String> {
    void deleteByTokenAndUserId(String token, UUID userId);
}
