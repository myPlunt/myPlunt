package com.myplunt.post;

import com.myplunt.common.exception.NotFoundException;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.notification.PostNotice;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.LatestPhoto;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantPhotoRepository;
import com.myplunt.post.dto.AddCommentRequest;
import com.myplunt.post.dto.AskQuestionRequest;
import com.myplunt.post.dto.CommentResponse;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.post.dto.UpdatePostRequest;
import com.myplunt.storage.StorageService;
import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PostService {

    private static final Logger log = LoggerFactory.getLogger(PostService.class);

    // The types the app can show so far; deaths join once the feed can show them.
    private static final List<String> FEED_TYPES = List.of(Post.NEW_PLANT, Post.NEW_PHOTO, Post.QUESTION);
    // shortcut: no paging yet, only the newest posts; add a cursor when the feed gets long.
    private static final int FEED_SIZE = 50;

    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostReactionRepository postReactionRepository;
    private final UserRepository userRepository;
    private final PlantPhotoRepository plantPhotoRepository;
    private final UserService userService;
    private final StorageService storageService;
    private final AuditLog auditLog;
    private final PushNotificationService pushNotificationService;

    public PostService(
            PostRepository postRepository,
            PostCommentRepository postCommentRepository,
            PostReactionRepository postReactionRepository,
            UserRepository userRepository,
            PlantPhotoRepository plantPhotoRepository,
            UserService userService,
            StorageService storageService,
            AuditLog auditLog,
            PushNotificationService pushNotificationService) {
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
        this.postReactionRepository = postReactionRepository;
        this.userRepository = userRepository;
        this.plantPhotoRepository = plantPhotoRepository;
        this.userService = userService;
        this.storageService = storageService;
        this.auditLog = auditLog;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional
    public PostResponse askQuestion(UUID userId, AskQuestionRequest request) {
        if (request.photoKey() != null) {
            if (!storageService.isCategory(request.photoKey(), PhotoCategory.POST)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That photo can't be added to a question.");
            }
            storageService.confirmUpload(userId, request.photoKey());
        }
        Post saved = postRepository.save(new Post(userId, request.body(), request.photoKey()));
        auditLog.recorded(AuditEvent.QUESTION_ASKED, userId, userId,
                Map.of("post_id", saved.getId(), "has_photo", request.photoKey() != null));
        User author = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        return toResponse(saved, author, null, null, 0, 0, false);
    }

    // A new plant post has no words of its own: the plant is edited on its own page.
    @Transactional
    public PostResponse updatePost(UUID userId, UUID postId, UpdatePostRequest request) {
        Post post = findOwnPost(userId, postId);
        String body = request.body() == null || request.body().isEmpty() ? null : request.body();
        switch (post.getPostType()) {
            case Post.QUESTION -> {
                if (body == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question must not be blank.");
                }
            }
            case Post.NEW_PHOTO -> {
                if (body != null && body.length() > Post.COMMENT_MAX_LENGTH) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment must be at most 120 characters.");
                }
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This post has no text to edit.");
        }
        post.setBody(body);
        auditLog.recorded(AuditEvent.POST_UPDATED, userId, userId,
                Map.of("post_id", postId, "post_type", post.getPostType()));
        return toResponses(userId, List.of(post)).getFirst();
    }

    // The shared plant or photo stays; a question's own photo file goes with the post.
    @Transactional
    public void deletePost(UUID userId, UUID postId) {
        Post post = findOwnPost(userId, postId);
        postRepository.delete(post);
        auditLog.recorded(AuditEvent.POST_DELETED, userId, userId,
                Map.of("post_id", postId, "post_type", post.getPostType()));
        if (post.getPhotoKey() == null) {
            return;
        }
        // Flushed so the row is gone before the file is.
        postRepository.flush();
        // A leftover file only costs storage.
        try {
            storageService.deleteObject(post.getPhotoKey());
        } catch (RuntimeException e) {
            StructuredLog.warning(log, LogEvent.PHOTO_CLEANUP_FAILED, Map.of(
                    "post_id", postId, "photo_key", post.getPhotoKey(), "reason", e.getClass().getSimpleName()));
        }
    }

    private Post findOwnPost(UUID userId, UUID postId) {
        return postRepository.findByIdAndUserId(postId, userId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(UUID userId) {
        return toResponses(userId, postRepository.findFeed(userId, FEED_TYPES, Limit.of(FEED_SIZE)));
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getOwnPosts(UUID userId) {
        return getUserPosts(userId, userId);
    }

    // Doesn't check they're friends: FriendService does before calling this.
    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(UUID viewerId, UUID authorId) {
        return toResponses(viewerId, postRepository.findOwn(authorId, FEED_TYPES));
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(UUID userId, UUID postId) {
        return toResponses(userId, List.of(findVisiblePost(userId, postId))).getFirst();
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID userId, UUID postId) {
        findVisiblePost(userId, postId);
        List<PostComment> comments = postCommentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        Map<UUID, User> authors = userRepository
                .findAllById(comments.stream().map(PostComment::getAuthorId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return comments.stream().map(comment -> toResponse(comment, authors.get(comment.getAuthorId()))).toList();
    }

    @Transactional
    public CommentResponse addComment(UUID userId, UUID postId, AddCommentRequest request) {
        Post post = findVisiblePost(userId, postId);
        List<UUID> earlierCommenters = postCommentRepository.findAuthorIds(postId);
        PostComment saved = postCommentRepository.save(new PostComment(postId, userId, request.body()));
        auditLog.recorded(AuditEvent.COMMENT_ADDED, userId, userId,
                Map.of("post_id", postId, "comment_id", saved.getId()));
        if (!post.getUserId().equals(userId)) {
            pushNotificationService.sendPostComment(userId, notice(post), request.body());
        }
        pushNotificationService.sendCommentReply(userId, notice(post), request.body(), earlierCommenters);
        User author = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        return toResponse(saved, author);
    }

    @Transactional
    public void water(UUID userId, UUID postId) {
        Post post = findVisiblePost(userId, postId);
        if (post.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't water your own post.");
        }
        if (postReactionRepository.existsByPostIdAndUserId(postId, userId)) {
            return;
        }
        postReactionRepository.save(new PostReaction(postId, userId));
        auditLog.recorded(AuditEvent.POST_WATERED, userId, userId, Map.of("post_id", postId));
        pushNotificationService.sendPostWatered(userId, notice(post));
    }

    // Only touches the user's own row, so it needs no visibility check.
    @Transactional
    public void unwater(UUID userId, UUID postId) {
        if (postReactionRepository.deleteByPostIdAndUserId(postId, userId) > 0) {
            auditLog.recorded(AuditEvent.POST_UNWATERED, userId, userId, Map.of("post_id", postId));
        }
    }

    private static PostNotice notice(Post post) {
        return new PostNotice(post.getId(), post.getUserId(), post.getPostType(),
                post.getPlant() == null ? null : post.getPlant().getName(),
                Post.QUESTION.equals(post.getPostType()) ? post.getBody() : null);
    }

    private Post findVisiblePost(UUID userId, UUID postId) {
        return postRepository.findVisible(postId, userId, FEED_TYPES)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }

    private CommentResponse toResponse(PostComment comment, User author) {
        return new CommentResponse(
                comment.getId(), userService.toSummary(author, null), comment.getBody(), comment.getCreatedAt());
    }

    private List<PostResponse> toResponses(UUID userId, List<Post> posts) {
        List<UUID> postIds = posts.stream().map(Post::getId).toList();
        Map<UUID, Long> commentCounts = postCommentRepository
                .countByPostIds(postIds)
                .stream()
                .collect(Collectors.toMap(PostCount::postId, PostCount::count));
        Map<UUID, Long> waterCounts = postReactionRepository
                .countByPostIds(postIds)
                .stream()
                .collect(Collectors.toMap(PostCount::postId, PostCount::count));
        Set<UUID> watered = new HashSet<>(postReactionRepository.findWateredPostIds(userId, postIds));
        Map<UUID, User> authors = userRepository.findAllById(posts.stream().map(Post::getUserId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
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
                    return toResponse(post, author, friendship, latestPhotoKey,
                            commentCounts.getOrDefault(post.getId(), 0L),
                            waterCounts.getOrDefault(post.getId(), 0L),
                            watered.contains(post.getId()));
                })
                .toList();
    }

    // A question shows its own photo, a photo post the photo that was shared, and a new plant
    // the plant's current one (latestPhotoKey).
    private PostResponse toResponse(
            Post post,
            User author,
            String friendship,
            String latestPhotoKey,
            long commentCount,
            long waterCount,
            boolean wateredByMe) {
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
                commentCount,
                waterCount,
                wateredByMe,
                post.getCreatedAt());
    }
}
