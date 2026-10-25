package com.myplunt.post;

import com.myplunt.common.exception.NotFoundException;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.notification.PostNotice;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantPhoto;
import com.myplunt.plant.PlantPhotoSharedEvent;
import com.myplunt.plant.PlantService;
import com.myplunt.plant.PlantSharedEvent;
import com.myplunt.post.dto.AddCommentRequest;
import com.myplunt.post.dto.AskQuestionRequest;
import com.myplunt.post.dto.CommentResponse;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.post.dto.UpdatePostRequest;
import com.myplunt.storage.StorageService;
import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.user.User;
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
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private PostCommentRepository postCommentRepository;

    @Mock
    private PostReactionRepository postReactionRepository;

    @Mock
    private UserService userService;

    @Mock
    private PlantService plantService;

    @Mock
    private StorageService storageService;

    @Mock
    private AuditLog auditLog;

    @Mock
    private PushNotificationService pushNotificationService;

    private PostService postService() {
        return new PostService(postRepository, postCommentRepository, postReactionRepository, userService, plantService, storageService, auditLog,
                pushNotificationService);
    }

    private static <T> T withId(T entity, UUID id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    @Test
    void getFeed_mapsEachPostWithItsAuthorThePlantsCurrentPhotoAndItsCounts() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        User friend = withId(new User("emma", "emma@example.com", "hashed"), UUID.randomUUID());
        Plant gus = withId(new Plant(friend.getId(), "Gus the Fern"), UUID.randomUUID());
        Plant vera = withId(new Plant(me.getId(), "Vera"), UUID.randomUUID());
        Post friendsPost = withId(new Post(friend.getId(), gus, Post.NEW_PLANT), UUID.randomUUID());
        Post myPost = withId(new Post(me.getId(), vera, Post.NEW_PLANT), UUID.randomUUID());
        when(postRepository.findFeed(eq(me.getId()), eq(List.of(Post.NEW_PLANT, Post.NEW_PHOTO, Post.QUESTION)), any()))
                .thenReturn(List.of(friendsPost, myPost));
        when(userService.loadUsers(anyList())).thenReturn(List.of(me, friend));
        when(plantService.getPhotoUrls(anyList())).thenReturn(Map.of(gus.getId(), "https://storage.test/gus.jpg?signed"));
        when(postCommentRepository.countByPostIds(anyCollection()))
                .thenReturn(List.of(new PostCount(friendsPost.getId(), 3)));
        when(postReactionRepository.countByPostIds(anyCollection()))
                .thenReturn(List.of(new PostCount(friendsPost.getId(), 2)));
        when(postReactionRepository.findWateredPostIds(eq(me.getId()), anyCollection()))
                .thenReturn(List.of(friendsPost.getId()));
        UserSummaryResponse emma = new UserSummaryResponse(friend.getId(), "emma", null, null, "friends");
        UserSummaryResponse self = new UserSummaryResponse(me.getId(), "me", null, null, null);
        when(userService.toSummary(friend, "friends")).thenReturn(emma);
        when(userService.toSummary(me, null)).thenReturn(self);

        List<PostResponse> feed = postService().getFeed(me.getId());

        assertThat(feed).containsExactly(
                new PostResponse(friendsPost.getId(), Post.NEW_PLANT, emma, gus.getId(), "Gus the Fern", null,
                        "https://storage.test/gus.jpg?signed", 3, 2, true, friendsPost.getCreatedAt()),
                new PostResponse(myPost.getId(), Post.NEW_PLANT, self, vera.getId(), "Vera", null, null, 0, 0, false, myPost.getCreatedAt()));
    }

    @Test
    void getUserPosts_mapsTheAuthorsPostsAsTheViewerSeesThem() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        User friend = withId(new User("emma", "emma@example.com", "hashed"), UUID.randomUUID());
        Post question = withId(new Post(friend.getId(), "Why are the leaves yellow?", null), UUID.randomUUID());
        when(postRepository.findOwn(friend.getId(), List.of(Post.NEW_PLANT, Post.NEW_PHOTO, Post.QUESTION)))
                .thenReturn(List.of(question));
        when(userService.loadUsers(anyList())).thenReturn(List.of(friend));
        UserSummaryResponse emma = new UserSummaryResponse(friend.getId(), "emma", null, null, "friends");
        when(userService.toSummary(friend, "friends")).thenReturn(emma);

        assertThat(postService().getUserPosts(me.getId(), friend.getId()))
                .singleElement()
                .satisfies(response -> assertThat(response.author()).isEqualTo(emma));
    }

    @Test
    void getFeed_showsAPhotoPostsOwnPhotoNotThePlantsNewest() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        Plant vera = withId(new Plant(me.getId(), "Vera"), UUID.randomUUID());
        PlantPhoto weekTwo = new PlantPhoto(vera, me.getId(), "plants/vera-week-2.jpg", null);
        Post post = withId(new Post(me.getId(), weekTwo, null), UUID.randomUUID());
        when(postRepository.findFeed(eq(me.getId()), any(), any())).thenReturn(List.of(post));
        when(userService.loadUsers(anyList())).thenReturn(List.of(me));
        // A newer photo was added since; the post still shows the one that was shared.
        when(plantService.getPhotoUrls(anyList())).thenReturn(Map.of(vera.getId(), "https://storage.test/week-6.jpg"));
        when(storageService.createReadUrl("plants/vera-week-2.jpg")).thenReturn("https://storage.test/week-2.jpg");

        List<PostResponse> feed = postService().getFeed(me.getId());

        assertThat(feed).singleElement().satisfies(response -> {
            assertThat(response.type()).isEqualTo(Post.NEW_PHOTO);
            assertThat(response.photoUrl()).isEqualTo("https://storage.test/week-2.jpg");
        });
    }

    @Test
    void onPlantShared_savesANewPlantPost() {
        UUID userId = UUID.randomUUID();
        Plant vera = withId(new Plant(userId, "Vera"), UUID.randomUUID());

        postService().onPlantShared(new PlantSharedEvent(userId, vera));

        ArgumentCaptor<Post> saved = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(saved.capture());
        assertThat(saved.getValue().getPostType()).isEqualTo(Post.NEW_PLANT);
        assertThat(saved.getValue().getUserId()).isEqualTo(userId);
        assertThat(saved.getValue().getPlant()).isSameAs(vera);
    }

    @Test
    void onPlantPhotoShared_savesAPhotoPostWithTheComment() {
        UUID userId = UUID.randomUUID();
        Plant vera = withId(new Plant(userId, "Vera"), UUID.randomUUID());
        PlantPhoto photo = new PlantPhoto(vera, userId, "plants/vera.jpg", null);

        postService().onPlantPhotoShared(new PlantPhotoSharedEvent(userId, photo, "First split leaf!"));

        ArgumentCaptor<Post> saved = ArgumentCaptor.forClass(Post.class);
        verify(postRepository).save(saved.capture());
        assertThat(saved.getValue().getPostType()).isEqualTo(Post.NEW_PHOTO);
        assertThat(saved.getValue().getPhoto()).isSameAs(photo);
        assertThat(saved.getValue().getBody()).isEqualTo("First split leaf!");
    }

    @Test
    void askQuestion_confirmsItsPhotoAndSavesAnOpenQuestion() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        String key = "posts/" + me.getId() + "/leaves.jpg";
        when(storageService.isCategory(key, PhotoCategory.POST)).thenReturn(true);
        when(postRepository.save(any())).thenAnswer(invocation -> withId(invocation.getArgument(0), UUID.randomUUID()));
        when(userService.loadUser(me.getId())).thenReturn(me);
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
        when(userService.loadUsers(anyList())).thenReturn(List.of(me));

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
    void addComment_savesItUnderAFriendsPost() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        Post question = withId(new Post(UUID.randomUUID(), "Why?", null), UUID.randomUUID());
        when(postRepository.findVisible(eq(question.getId()), eq(me.getId()), anyCollection()))
                .thenReturn(Optional.of(question));
        UUID earlierCommenter = UUID.randomUUID();
        when(postCommentRepository.findAuthorIds(question.getId())).thenReturn(List.of(earlierCommenter));
        when(postCommentRepository.save(any())).thenAnswer(invocation -> withId(invocation.getArgument(0), UUID.randomUUID()));
        when(userService.loadUser(me.getId())).thenReturn(me);
        UserSummaryResponse self = new UserSummaryResponse(me.getId(), "me", null, null, null);
        when(userService.toSummary(me, null)).thenReturn(self);

        CommentResponse response = postService().addComment(me.getId(), question.getId(), new AddCommentRequest("Too much sun"));

        ArgumentCaptor<PostComment> saved = ArgumentCaptor.forClass(PostComment.class);
        verify(postCommentRepository).save(saved.capture());
        assertThat(saved.getValue().getPostId()).isEqualTo(question.getId());
        assertThat(saved.getValue().getAuthorId()).isEqualTo(me.getId());
        assertThat(response.body()).isEqualTo("Too much sun");
        assertThat(response.author()).isEqualTo(self);
        PostNotice notice = new PostNotice(question.getId(), question.getUserId(), Post.QUESTION, null, "Why?");
        verify(pushNotificationService).sendPostComment(me.getId(), notice, "Too much sun");
        verify(pushNotificationService).sendCommentReply(me.getId(), notice, "Too much sun", List.of(earlierCommenter));
    }

    @Test
    void addComment_throwsNotFoundForAPostTheUserCantSeeAndSavesNothing() {
        UUID userId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        when(postRepository.findVisible(eq(postId), eq(userId), anyCollection())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService().addComment(userId, postId, new AddCommentRequest("Hi")))
                .isInstanceOf(NotFoundException.class);
        verify(postCommentRepository, never()).save(any());
    }

    @Test
    void water_savesADropOnAFriendsPostOnlyOnce() {
        UUID userId = UUID.randomUUID();
        Post question = withId(new Post(UUID.randomUUID(), "Why?", null), UUID.randomUUID());
        when(postRepository.findVisible(eq(question.getId()), eq(userId), anyCollection()))
                .thenReturn(Optional.of(question));
        when(postReactionRepository.existsByPostIdAndUserId(question.getId(), userId)).thenReturn(false, true);

        postService().water(userId, question.getId());
        postService().water(userId, question.getId());

        ArgumentCaptor<PostReaction> saved = ArgumentCaptor.forClass(PostReaction.class);
        verify(postReactionRepository).save(saved.capture());
        assertThat(saved.getValue().getPostId()).isEqualTo(question.getId());
        assertThat(saved.getValue().getUserId()).isEqualTo(userId);
        verify(auditLog).recorded(AuditEvent.POST_WATERED, userId, userId, Map.of("post_id", question.getId()));
        verify(pushNotificationService).sendPostWatered(userId,
                new PostNotice(question.getId(), question.getUserId(), Post.QUESTION, null, "Why?"));
    }

    @Test
    void water_rejectsTheUsersOwnPostAndSavesNothing() {
        UUID userId = UUID.randomUUID();
        Post question = withId(new Post(userId, "Why?", null), UUID.randomUUID());
        when(postRepository.findVisible(eq(question.getId()), eq(userId), anyCollection()))
                .thenReturn(Optional.of(question));

        assertThatThrownBy(() -> postService().water(userId, question.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(postReactionRepository, never()).save(any());
    }

    @Test
    void deletePost_throwsNotFoundForSomeoneElsesPostAndDeletesNothing() {
        UUID userId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        when(postRepository.findByIdAndUserId(postId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService().deletePost(userId, postId)).isInstanceOf(NotFoundException.class);
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
