package com.myplunt.post;

import com.myplunt.constants.ApiPaths;
import com.myplunt.post.dto.AddCommentRequest;
import com.myplunt.post.dto.AskQuestionRequest;
import com.myplunt.post.dto.CommentResponse;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.post.dto.UpdatePostRequest;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    // Plant and photo posts are created where they happen (adding a plant or a photo); a
    // question has nowhere else to come from, so it's asked here.
    @PostMapping(ApiPaths.Posts.QUESTIONS)
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse askQuestion(@AuthenticationPrincipal User principal, @Valid @RequestBody AskQuestionRequest request) {
        return postService.askQuestion(principal.getId(), request);
    }

    @GetMapping(ApiPaths.Posts.FEED)
    public List<PostResponse> feed(@AuthenticationPrincipal User principal) {
        return postService.getFeed(principal.getId());
    }

    @GetMapping(ApiPaths.Posts.MINE)
    public List<PostResponse> mine(@AuthenticationPrincipal User principal) {
        return postService.getOwnPosts(principal.getId());
    }

    @GetMapping(ApiPaths.Posts.BY_ID)
    public PostResponse get(@AuthenticationPrincipal User principal, @PathVariable UUID postId) {
        return postService.getPost(principal.getId(), postId);
    }

    @PutMapping(ApiPaths.Posts.BY_ID)
    public PostResponse update(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostRequest request) {
        return postService.updatePost(principal.getId(), postId, request);
    }

    @GetMapping(ApiPaths.Posts.COMMENTS)
    public List<CommentResponse> comments(@AuthenticationPrincipal User principal, @PathVariable UUID postId) {
        return postService.getComments(principal.getId(), postId);
    }

    @PostMapping(ApiPaths.Posts.COMMENTS)
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID postId,
            @Valid @RequestBody AddCommentRequest request) {
        return postService.addComment(principal.getId(), postId, request);
    }

    @DeleteMapping(ApiPaths.Posts.BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User principal, @PathVariable UUID postId) {
        postService.deletePost(principal.getId(), postId);
    }
}
