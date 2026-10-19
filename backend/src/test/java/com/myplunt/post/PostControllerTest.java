package com.myplunt.post;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.post.dto.AskQuestionRequest;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(PostController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class PostControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private PostService postService;

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

    private RestTestClient.ResponseSpec ask(Object body) {
        return restTestClient.post().uri("/v1/posts/questions")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange();
    }

    @Test
    void askQuestion_createsItForTheSignedInUser() {
        UUID janeId = authenticateAsJane();
        AskQuestionRequest request = new AskQuestionRequest("Why are my leaves red?", null);
        PostResponse question = new PostResponse(UUID.randomUUID(), Post.QUESTION,
                new UserSummaryResponse(janeId, "jane", null, null, null), null, null, "Why are my leaves red?", null,
                Instant.parse("2026-10-19T10:00:00Z"));
        when(postService.askQuestion(janeId, request)).thenReturn(question);

        ask(request).expectStatus().isCreated().expectBody(PostResponse.class).isEqualTo(question);
    }

    @Test
    void askQuestion_rejectsABlankQuestion() {
        authenticateAsJane();

        ask(new AskQuestionRequest("   ", null)).expectStatus().isBadRequest();
        verify(postService, never()).askQuestion(any(), any());
    }
}
