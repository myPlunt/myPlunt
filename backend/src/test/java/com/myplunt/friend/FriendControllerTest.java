package com.myplunt.friend;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.friend.dto.FriendRequestsResponse;
import com.myplunt.friend.dto.SendFriendRequest;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
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
    void sendRequest_rejectsAMissingUser() {
        authenticateAsJane();

        post("{}").expectStatus().isBadRequest();
        verify(friendService, never()).sendRequest(any(), any());
    }

    @Test
    void sendRequest_returnsConflictWhenAlreadyAsked() {
        authenticateAsJane();
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Request already sent"))
                .when(friendService).sendRequest(any(), any());

        post(new SendFriendRequest(UUID.randomUUID())).expectStatus().isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void sendRequest_rejectsRequestsWithoutAToken() {
        restTestClient.post().uri("/v1/friends/requests")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new SendFriendRequest(UUID.randomUUID()))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void friends_returnsTheSignedInUsersFriends() {
        UUID janeId = authenticateAsJane();
        List<UserSummaryResponse> friends =
                List.of(new UserSummaryResponse(UUID.randomUUID(), "tom", null, null, "friends"));
        when(friendService.getFriends(janeId)).thenReturn(friends);

        restTestClient.get().uri("/v1/friends")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(new ParameterizedTypeReference<List<UserSummaryResponse>>() {})
                .isEqualTo(friends);
    }

    @Test
    void requests_returnsReceivedAndSent() {
        UUID janeId = authenticateAsJane();
        FriendRequestsResponse requests = new FriendRequestsResponse(
                List.of(new UserSummaryResponse(UUID.randomUUID(), "tom", null, null, "request_received")),
                List.of());
        when(friendService.getRequests(janeId)).thenReturn(requests);

        restTestClient.get().uri("/v1/friends/requests")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(FriendRequestsResponse.class)
                .isEqualTo(requests);
    }

    @Test
    void accept_answersTheRequestFromThatUser() {
        UUID janeId = authenticateAsJane();
        UUID tomId = UUID.randomUUID();

        postAnswer("/v1/friends/requests/" + tomId + "/accept").expectStatus().isNoContent();
        verify(friendService).accept(janeId, tomId);
    }

    @Test
    void decline_answersTheRequestFromThatUser() {
        UUID janeId = authenticateAsJane();
        UUID tomId = UUID.randomUUID();

        postAnswer("/v1/friends/requests/" + tomId + "/decline").expectStatus().isNoContent();
        verify(friendService).decline(janeId, tomId);
    }

    @Test
    void accept_returnsNotFoundWithoutARequest() {
        authenticateAsJane();
        doThrow(new IllegalStateException("No friend request from this user"))
                .when(friendService).accept(any(), any());

        postAnswer("/v1/friends/requests/" + UUID.randomUUID() + "/accept").expectStatus().isNotFound();
    }

    @Test
    void listsAndAnswers_rejectRequestsWithoutAToken() {
        restTestClient.get().uri("/v1/friends").exchange().expectStatus().isUnauthorized();
        restTestClient.get().uri("/v1/friends/requests").exchange().expectStatus().isUnauthorized();
        restTestClient.post().uri("/v1/friends/requests/" + UUID.randomUUID() + "/accept")
                .exchange()
                .expectStatus().isUnauthorized();
        restTestClient.post().uri("/v1/friends/requests/" + UUID.randomUUID() + "/decline")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    private RestTestClient.ResponseSpec postAnswer(String uri) {
        return restTestClient.post().uri(uri).header("Authorization", "Bearer access-token").exchange();
    }
}
