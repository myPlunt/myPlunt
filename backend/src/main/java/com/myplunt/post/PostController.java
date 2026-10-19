package com.myplunt.post;

import com.myplunt.constants.ApiPaths;
import com.myplunt.post.dto.AskQuestionRequest;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
