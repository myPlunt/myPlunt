package com.myplunt.post;

import com.myplunt.plant.LatestPhoto;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantPhotoRepository;
import com.myplunt.post.dto.AskQuestionRequest;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.storage.StorageService;
import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserService;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PostService {

    // The types the app can show so far; deaths join once the feed can show them.
    private static final List<String> FEED_TYPES = List.of(Post.NEW_PLANT, Post.NEW_PHOTO, Post.QUESTION);
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

    // A sticky-note question for the user's friends, with an optional photo of its own.
    @Transactional
    public PostResponse askQuestion(UUID userId, AskQuestionRequest request) {
        if (request.photoKey() != null) {
            // A plant photo or a profile picture can't be reused here (and later deleted with it).
            if (!storageService.isCategory(request.photoKey(), PhotoCategory.POST)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That photo can't be added to a question.");
            }
            // Checks the key is the user's own and within the size limit.
            storageService.confirmUpload(userId, request.photoKey());
        }
        Post saved = postRepository.save(new Post(userId, request.body(), request.photoKey()));
        User author = userRepository.findById(userId).orElseThrow(() -> new IllegalStateException("User not found"));
        return toResponse(saved, author, null, null);
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
                .findLatestPhotos(posts.stream()
                        .filter(post -> post.getPlant() != null)
                        .map(post -> post.getPlant().getId())
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(LatestPhoto::plantId, LatestPhoto::photoKey, (first, second) -> first));
        return posts.stream()
                .map(post -> {
                    User author = authors.get(post.getUserId());
                    // Only the user and their friends are in the feed.
                    String friendship = author.getId().equals(userId) ? null : "friends";
                    String latestPhotoKey = post.getPlant() == null ? null : photoKeys.get(post.getPlant().getId());
                    return toResponse(post, author, friendship, latestPhotoKey);
                })
                .toList();
    }

    // A question shows its own photo, a photo post the photo that was shared, and a new plant
    // the plant's current one (latestPhotoKey).
    private PostResponse toResponse(Post post, User author, String friendship, String latestPhotoKey) {
        String photoKey = post.getPhotoKey() != null
                ? post.getPhotoKey()
                : post.getPhoto() != null ? post.getPhoto().getPhotoKey() : latestPhotoKey;
        Plant plant = post.getPlant();
        return new PostResponse(
                post.getId(),
                post.getPostType(),
                userService.toSummary(author, friendship),
                plant == null ? null : plant.getId(),
                plant == null ? null : plant.getName(),
                post.getBody(),
                photoKey == null ? null : storageService.createReadUrl(photoKey),
                post.getCreatedAt());
    }
}
