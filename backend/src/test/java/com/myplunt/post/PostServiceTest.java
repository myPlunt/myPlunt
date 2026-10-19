package com.myplunt.post;

import com.myplunt.plant.LatestPhoto;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantPhoto;
import com.myplunt.plant.PlantPhotoRepository;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.storage.StorageService;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserService;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
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

    private PostService postService() {
        return new PostService(postRepository, userRepository, plantPhotoRepository, userService, storageService);
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
        when(postRepository.findFeed(eq(me.getId()), eq(List.of(Post.NEW_PLANT, Post.NEW_PHOTO)), any()))
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
                new PostResponse(friendsPost.getId(), Post.NEW_PLANT, emma, gus.getId(), "Gus the Fern",
                        "https://storage.test/gus.jpg?signed", friendsPost.getCreatedAt()),
                new PostResponse(myPost.getId(), Post.NEW_PLANT, self, vera.getId(), "Vera", null, myPost.getCreatedAt()));
    }

    @Test
    void getFeed_showsAPhotoPostsOwnPhotoNotThePlantsNewest() {
        User me = withId(new User("me", "me@example.com", "hashed"), UUID.randomUUID());
        Plant vera = withId(new Plant(me.getId(), "Vera"), UUID.randomUUID());
        PlantPhoto weekTwo = new PlantPhoto(vera, me.getId(), "plants/vera-week-2.jpg", null);
        Post post = withId(new Post(me.getId(), weekTwo), UUID.randomUUID());
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
}
