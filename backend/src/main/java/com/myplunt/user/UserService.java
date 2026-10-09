package com.myplunt.user;

import com.myplunt.user.dto.UserResponse;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse getUser(UUID id) {
        return userRepository.findById(id)
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getEmail()))
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
