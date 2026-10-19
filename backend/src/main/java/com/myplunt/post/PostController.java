package com.myplunt.post;

import com.myplunt.constants.ApiPaths;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    // Posts are created where they happen (e.g. adding a plant), so there's no POST here yet.
    @GetMapping(ApiPaths.Posts.FEED)
    public List<PostResponse> feed(@AuthenticationPrincipal User principal) {
        return postService.getFeed(principal.getId());
    }
}
