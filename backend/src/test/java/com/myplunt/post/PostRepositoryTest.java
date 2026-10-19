package com.myplunt.post;

import com.myplunt.friend.Friendship;
import com.myplunt.friend.FriendshipRepository;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Limit;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Real Postgres: who counts as a friend is decided by the query's friendship subqueries.
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PostRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User user(String username) {
        return userRepository.save(new User(username, username + "@example.com", "hashed"));
    }

    // Rows saved in one test transaction all get the same time, so the order is set by hand.
    private Post newPlantPost(User owner, String plantName, int hoursAgo) {
        Plant plant = plantRepository.save(new Plant(owner.getId(), plantName));
        Post post = postRepository.saveAndFlush(new Post(owner.getId(), plant, Post.NEW_PLANT));
        jdbcTemplate.update("update posts set created_at = now() - make_interval(hours => ?) where id = ?",
                hoursAgo, post.getId());
        return post;
    }

    @Test
    void findFeed_returnsOwnAndAcceptedFriendsPostsNewestFirst() {
        User me = user("me");
        User asked = user("asked");
        User asker = user("asker");
        User pending = user("pending");
        User stranger = user("stranger");
        Friendship sent = new Friendship(me.getId(), asked.getId());
        sent.accept();
        Friendship received = new Friendship(asker.getId(), me.getId());
        received.accept();
        friendshipRepository.saveAll(List.of(sent, received, new Friendship(pending.getId(), me.getId())));
        Post mine = newPlantPost(me, "Vera", 3);
        Post fromAsked = newPlantPost(asked, "Gus", 1);
        Post fromAsker = newPlantPost(asker, "Basil", 2);
        newPlantPost(pending, "Not yet a friend", 0);
        newPlantPost(stranger, "Someone else's", 0);

        List<Post> feed = postRepository.findFeed(me.getId(), List.of(Post.NEW_PLANT), Limit.of(50));

        assertThat(feed).extracting(Post::getId).containsExactly(fromAsked.getId(), fromAsker.getId(), mine.getId());
    }
}
