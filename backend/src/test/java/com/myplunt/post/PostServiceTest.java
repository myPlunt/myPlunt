package com.myplunt.post;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.plant.LatestPhoto;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantPhoto;
import com.myplunt.plant.PlantPhotoRepository;
import com.myplunt.post.dto.AskQuestionRequest;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.post.dto.UpdatePostRequest;
import com.myplunt.storage.StorageService;
import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserService;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PlantPhotoRepository plantPhotoRepository;

    @Mock
    private UserService userService;

    @Mock
    private StorageService storageService;

    @Mock
    private AuditLog auditLog;

    private PostService postService() {
        return new PostService(postRepository, userRepository, plantPhotoRepository, userService, storageService, auditLog);
    }

    private static <T> T withId(T entity, UUID id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    @Test
    void getFeed_mapsEachPostWithItsAuthorAndThePlantsCurrentPhoto() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        User friend = withId(new User("emma", "emma@example.com", "hashed"), UUID.randomUUID());
        Plant gus = withId(new Plant(friend.getId(), "Gus the Fern"), UUID.randomUUID());
        Plant vera = withId(new Plant(me.getId(), "Vera"), UUID.randomUUID());
        Post friendsPost = withId(new Post(friend.getId(), gus, Post.NEW_PLANT), UUID.randomUUID());
        Post myPost = withId(new Post(me.getId(), vera, Post.NEW_PLANT), UUID.randomUUID());
        when(postRepository.findFeed(eq(me.getId()), eq(List.of(Post.NEW_PLANT, Post.NEW_PHOTO, Post.QUESTION)), any()))
                .thenReturn(List.of(friendsPost, myPost));
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(me, friend));
        when(plantPhotoRepository.findLatestPhotos(anyCollection()))
                .thenReturn(List.of(new LatestPhoto(gus.getId(), "plants/gus.jpg")));
        when(storageService.createReadUrl("plants/gus.jpg")).thenReturn("https://storage.test/gus.jpg?signed");
        UserSummaryResponse emma = new UserSummaryResponse(friend.getId(), "emma", null, null, "friends");
        UserSummaryResponse self = new UserSummaryResponse(me.getId(), "me", null, null, null);
        when(userService.toSummary(friend, "friends")).thenReturn(emma);
        when(userService.toSummary(me, null)).thenReturn(self);

        List<PostResponse> feed = postService().getFeed(me.getId());

        assertThat(feed).containsExactly(
                new PostResponse(friendsPost.getId(), Post.NEW_PLANT, emma, gus.getId(), "Gus the Fern", null,
                        "https://storage.test/gus.jpg?signed", friendsPost.getCreatedAt()),
                new PostResponse(myPost.getId(), Post.NEW_PLANT, self, vera.getId(), "Vera", null, null, myPost.getCreatedAt()));
    }

    @Test
    void getFeed_showsAPhotoPostsOwnPhotoNotThePlantsNewest() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        Plant vera = withId(new Plant(me.getId(), "Vera"), UUID.randomUUID());
        PlantPhoto weekTwo = new PlantPhoto(vera, me.getId(), "plants/vera-week-2.jpg", null);
        Post post = withId(new Post(me.getId(), weekTwo, null), UUID.randomUUID());
        when(postRepository.findFeed(eq(me.getId()), any(), any())).thenReturn(List.of(post));
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(me));
        // A newer photo was added since; the post still shows the one that was shared.
        when(plantPhotoRepository.findLatestPhotos(anyCollection()))
                .thenReturn(List.of(new LatestPhoto(vera.getId(), "plants/vera-week-6.jpg")));
        when(storageService.createReadUrl("plants/vera-week-2.jpg")).thenReturn("https://storage.test/week-2.jpg");

        List<PostResponse> feed = postService().getFeed(me.getId());

        assertThat(feed).singleElement().satisfies(response -> {
            assertThat(response.type()).isEqualTo(Post.NEW_PHOTO);
            assertThat(response.photoUrl()).isEqualTo("https://storage.test/week-2.jpg");
        });
    }

    @Test
    void askQuestion_confirmsItsPhotoAndSavesAnOpenQuestion() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        String key = "posts/" + me.getId() + "/leaves.jpg";
        when(storageService.isCategory(key, PhotoCategory.POST)).thenReturn(true);
        when(postRepository.save(any())).thenAnswer(invocation -> withId(invocation.getArgument(0), UUID.randomUUID()));
        when(userRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(storageService.createReadUrl(key)).thenReturn("https://storage.test/leaves.jpg");

        PostResponse response = postService().askQuestion(me.getId(), new AskQuestionRequest("Why are my leaves red?", key));

        verify(storageService).confirmUpload(me.getId(), key);
        ArgumentCaptor<Post> saved = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(saved.capture());
        assertThat(saved.getValue().getPostType()).isEqualTo(Post.QUESTION);
        assertThat(saved.getValue().getUserId()).isEqualTo(me.getId());
        assertThat(saved.getValue().getPlant()).isNull();
        assertThat(response.body()).isEqualTo("Why are my leaves red?");
        assertThat(response.photoUrl()).isEqualTo("https://storage.test/leaves.jpg");
        verify(auditLog).recorded(AuditEvent.QUESTION_ASKED, me.getId(), me.getId(),
                Map.of("post_id", response.id(), "has_photo", true));
    }

    @Test
    void askQuestion_rejectsAPhotoUploadedForSomethingElseAndSavesNothing() {
        UUID userId = UUID.randomUUID();
        String plantPhoto = "plants/" + userId + "/vera.jpg";
        when(storageService.isCategory(plantPhoto, PhotoCategory.POST)).thenReturn(false);

        assertThatThrownBy(() -> postService().askQuestion(userId, new AskQuestionRequest("Why?", plantPhoto)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(postRepository, never()).save(any());
    }

    @Test
    void updatePost_changesTheQuestionsText() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        Post question = withId(new Post(me.getId(), "Why are my leaves red?", null), UUID.randomUUID());
        when(postRepository.findByIdAndUserId(question.getId(), me.getId())).thenReturn(Optional.of(question));
        when(userRepository.findAllById(anyCollection())).thenReturn(List.of(me));

        PostResponse response = postService().updatePost(me.getId(), question.getId(), new UpdatePostRequest("Why are they yellow?"));

        assertThat(question.getBody()).isEqualTo("Why are they yellow?");
        assertThat(response.body()).isEqualTo("Why are they yellow?");
        verify(auditLog).recorded(AuditEvent.POST_UPDATED, me.getId(), me.getId(),
                Map.of("post_id", question.getId(), "post_type", Post.QUESTION));
    }

    @Test
    void updatePost_rejectsANewPlantPostWhichHasNoTextOfItsOwn() {
        UUID userId = UUID.randomUUID();
        Plant vera = withId(new Plant(userId, "Vera"), UUID.randomUUID());
        Post post = withId(new Post(userId, vera, Post.NEW_PLANT), UUID.randomUUID());
        when(postRepository.findByIdAndUserId(post.getId(), userId)).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService().updatePost(userId, post.getId(), new UpdatePostRequest("Hi")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(post.getBody()).isNull();
    }

    @Test
    void deletePost_throwsNotFoundForSomeoneElsesPostAndDeletesNothing() {
        UUID userId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        when(postRepository.findByIdAndUserId(postId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService().deletePost(userId, postId)).isInstanceOf(IllegalStateException.class);
        verify(postRepository, never()).delete(any());
        verify(storageService, never()).deleteObject(any());
    }

    @Test
    void deletePost_removesAQuestionAndItsOwnPhoto() {
        UUID userId = UUID.randomUUID();
        Post question = withId(new Post(userId, "Why?", "posts/u/leaves.jpg"), UUID.randomUUID());
        when(postRepository.findByIdAndUserId(question.getId(), userId)).thenReturn(Optional.of(question));

        postService().deletePost(userId, question.getId());

        verify(postRepository).delete(question);
        verify(storageService).deleteObject("posts/u/leaves.jpg");
    }
}
