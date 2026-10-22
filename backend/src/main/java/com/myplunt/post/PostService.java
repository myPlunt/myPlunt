package com.myplunt.post;

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
        auditLog.recorded(AuditEvent.QUESTION_ASKED, userId, userId,
                Map.of("post_id", saved.getId(), "has_photo", request.photoKey() != null));
        User author = userRepository.findById(userId).orElseThrow(() -> new IllegalStateException("User not found"));
        return toResponse(saved, author, null, null, 0, 0, false);
    }

    // Only the words are the post's own: a question's text or a new photo's comment. A new plant
    // post is just the plant, which is edited on its own page.
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

    // Removes only the post: a shared plant or photo stays in the garden. A question's own
    // photo has nowhere else to be, so its file goes too.
    @Transactional
    public void deletePost(UUID userId, UUID postId) {
        Post post = findOwnPost(userId, postId);
        postRepository.delete(post);
        auditLog.recorded(AuditEvent.POST_DELETED, userId, userId,
                Map.of("post_id", postId, "post_type", post.getPostType()));
        if (post.getPhotoKey() == null) {
            return;
        }
        // Flushed first so the row is really gone before its file is, as in PlantService.deletePhoto.
        postRepository.flush();
        // The post is already gone for the user, so a leftover file only costs storage.
        try {
            storageService.deleteObject(post.getPhotoKey());
        } catch (RuntimeException e) {
            StructuredLog.warning(log, LogEvent.PHOTO_CLEANUP_FAILED, Map.of(
                    "post_id", postId, "photo_key", post.getPhotoKey(), "reason", e.getClass().getSimpleName()));
        }
    }

    // Someone else's post answers 404 too, so ids can't be probed.
    private Post findOwnPost(UUID userId, UUID postId) {
        return postRepository.findByIdAndUserId(postId, userId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));
    }

    // The user's and their friends' posts, newest first.
    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(UUID userId) {
        return toResponses(userId, postRepository.findFeed(userId, FEED_TYPES, Limit.of(FEED_SIZE)));
    }

    // The user's own posts, newest first, for their profile.
    @Transactional(readOnly = true)
    public List<PostResponse> getOwnPosts(UUID userId) {
        return getUserPosts(userId, userId);
    }

    // authorId's posts, newest first, as viewerId sees them. Doesn't check they're friends;
    // FriendService does that before a friend's profile gets here.
    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(UUID viewerId, UUID authorId) {
        return toResponses(viewerId, postRepository.findOwn(authorId, FEED_TYPES));
    }

    // The post's own page. Someone else's post that isn't a friend's answers 404, like one that doesn't exist.
    @Transactional(readOnly = true)
    public PostResponse getPost(UUID userId, UUID postId) {
        return toResponses(userId, List.of(findVisiblePost(userId, postId))).getFirst();
    }

    // A post's comments, oldest first, for anyone who may see the post.
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

    // Anyone who may see a post may comment on it: its author and their friends.
    @Transactional
    public CommentResponse addComment(UUID userId, UUID postId, AddCommentRequest request) {
        Post post = findVisiblePost(userId, postId);
        List<UUID> earlierCommenters = postCommentRepository.findAuthorIds(postId);
        PostComment saved = postCommentRepository.save(new PostComment(postId, userId, request.body()));
        auditLog.recorded(AuditEvent.COMMENT_ADDED, userId, userId,
                Map.of("post_id", postId, "comment_id", saved.getId()));
        // Replying under their own post doesn't notify the author.
        if (!post.getUserId().equals(userId)) {
            pushNotificationService.sendPostComment(userId, notice(post), request.body());
        }
        pushNotificationService.sendCommentReply(userId, notice(post), request.body(), earlierCommenters);
        User author = userRepository.findById(userId).orElseThrow(() -> new IllegalStateException("User not found"));
        return toResponse(saved, author);
    }

    // A drop of water on a friend's post: the app's like. Watering it again changes nothing.
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

    // Takes the user's drop back. Only their own row is touched, so it needs no visibility check.
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
                .orElseThrow(() -> new IllegalStateException("Post not found"));
    }

    private CommentResponse toResponse(PostComment comment, User author) {
        return new CommentResponse(
                comment.getId(), userService.toSummary(author, null), comment.getBody(), comment.getCreatedAt());
    }

    // Maps the posts in their given order, loading authors, plant photos, comment and water counts
    // and the viewer's drops in one query each.
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
