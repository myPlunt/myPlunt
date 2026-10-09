package com.myplunt.user;

import com.myplunt.user.dto.UserResponse;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    // Maps the principal JwtAuthFilter already loaded, so read-only endpoints like
    // /me don't query the same row twice. Endpoints that modify the user should
    // load it fresh here instead of reusing the principal.
    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail());
    }
}
