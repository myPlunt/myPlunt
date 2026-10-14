package com.myplunt.friend;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.friend.dto.SendFriendRequest;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(FriendController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class FriendControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private FriendService friendService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID authenticateAsJane() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        return id;
    }

    private RestTestClient.ResponseSpec post(Object body) {
        return restTestClient.post().uri("/v1/friends/requests")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange();
    }

    @Test
    void sendRequest_sendsItFromTheSignedInUser() {
        UUID janeId = authenticateAsJane();
        UUID tomId = UUID.randomUUID();

        post(new SendFriendRequest(tomId)).expectStatus().isNoContent();
        verify(friendService).sendRequest(janeId, tomId);
    }

    @Test
    void sendRequest_returnsConflictWhenAlreadyAsked() {
        authenticateAsJane();
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Request already sent"))
                .when(friendService).sendRequest(any(), any());

        post(new SendFriendRequest(UUID.randomUUID())).expectStatus().isEqualTo(HttpStatus.CONFLICT);
    }

}
