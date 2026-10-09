package com.myplunt.user;

import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Maps the principal JwtAuthFilter already loaded, so read-only endpoints like
    // /me don't query the same row twice. Endpoints that modify the user load it
    // fresh instead of reusing the principal (see updateProfile, changeEmail).
    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getBio());
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = loadUser(userId);

        // username is citext, so a change in letter case alone can't clash with another account.
        if (!user.getUsername().equalsIgnoreCase(request.username())
                && userRepository.findByUsername(request.username()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        user.setUsername(request.username());
        user.setBio(request.bio() == null || request.bio().isBlank() ? null : request.bio().strip());

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse changeEmail(UUID userId, ChangeEmailRequest request) {
        User user = loadUser(userId);

        // 403, not 401: the frontend treats 401 as an expired session.
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Current password is incorrect");
        }
        // email is citext too: the user's own address in different case isn't taken.
        if (!user.getEmail().equalsIgnoreCase(request.email())
                && userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        user.setEmail(request.email());

        return toResponse(userRepository.save(user));
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
