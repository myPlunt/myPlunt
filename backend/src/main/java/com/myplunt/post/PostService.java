package com.myplunt.post;

import com.myplunt.plant.LatestPhoto;
import com.myplunt.plant.PlantPhotoRepository;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.storage.StorageService;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserService;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PostService {

    // The types the app can show so far; questions and deaths join as the feed learns to
    // show them.
    private static final List<String> FEED_TYPES = List.of(Post.NEW_PLANT, Post.NEW_PHOTO);
    // shortcut: no paging yet, only the newest posts; add a cursor when the feed gets long.
    private static final int FEED_SIZE = 50;

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PlantPhotoRepository plantPhotoRepository;
    private final UserService userService;
    private final StorageService storageService;

    public PostService(
            PostRepository postRepository,
            UserRepository userRepository,
            PlantPhotoRepository plantPhotoRepository,
            UserService userService,
            StorageService storageService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.plantPhotoRepository = plantPhotoRepository;
        this.userService = userService;
        this.storageService = storageService;
    }

    // The user's and their friends' posts, newest first.
    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(UUID userId) {
        List<Post> posts = postRepository.findFeed(userId, FEED_TYPES, Limit.of(FEED_SIZE));
        Map<UUID, User> authors = userRepository.findAllById(posts.stream().map(Post::getUserId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        // Two photos can share the newest time; either one will do.
        Map<UUID, String> photoKeys = plantPhotoRepository
                .findLatestPhotos(posts.stream().map(post -> post.getPlant().getId()).distinct().toList())
                .stream()
                .collect(Collectors.toMap(LatestPhoto::plantId, LatestPhoto::photoKey, (first, second) -> first));
        return posts.stream()
                .map(post -> {
                    User author = authors.get(post.getUserId());
                    // A photo post shows its own photo; a new plant shows the plant's current one.
                    String photoKey = post.getPhoto() != null
                            ? post.getPhoto().getPhotoKey()
                            : photoKeys.get(post.getPlant().getId());
                    return new PostResponse(
                            post.getId(),
                            post.getPostType(),
                            // Only the user and their friends are in the feed.
                            userService.toSummary(author, author.getId().equals(userId) ? null : "friends"),
                            post.getPlant().getId(),
                            post.getPlant().getName(),
                            photoKey == null ? null : storageService.createReadUrl(photoKey),
                            post.getCreatedAt());
                })
                .toList();
    }
}
