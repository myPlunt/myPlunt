package com.myplunt.friend;

import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Real Postgres: the unordered pair index is what stops two rows for the same two people.
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FriendshipRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    private User user(String username) {
        return userRepository.save(new User(username, username + "@example.com", "hashed"));
    }

    @Test
    void findBetween_findsRequestsInEitherDirection() {
        User me = user("me");
        User asked = user("asked");
        User asker = user("asker");
        User stranger = user("stranger");
        User elsewhere = user("elsewhere");
        Friendship sent = friendshipRepository.save(new Friendship(me.getId(), asked.getId()));
        Friendship received = friendshipRepository.save(new Friendship(asker.getId(), me.getId()));
        friendshipRepository.save(new Friendship(asked.getId(), elsewhere.getId()));

        List<Friendship> found = friendshipRepository.findBetween(
                me.getId(), List.of(asked.getId(), asker.getId(), stranger.getId(), elsewhere.getId()));

        assertThat(found).extracting(Friendship::getId).containsExactlyInAnyOrder(sent.getId(), received.getId());
    }

}
