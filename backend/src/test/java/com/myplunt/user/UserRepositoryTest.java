package com.myplunt.user;

import com.myplunt.friend.FriendshipRepository;
import com.myplunt.user.dto.UserSummaryResponse;
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

// Runs the user search against real Postgres: citext matching and LIKE escaping can't be mocked.
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FriendshipRepository friendshipRepository;

    private User user(String username) {
        return userRepository.save(new User(username, username + "@example.com", "hashed"));
    }

    // Through UserService, which lowercases and escapes the query the way the repository expects.
    // No avatars here, so it never needs storage or the password encoder.
    private List<String> search(String query, User searcher) {
        return new UserService(userRepository, null, null, friendshipRepository, null)
                .search(searcher.getId(), query)
                .stream()
                .map(UserSummaryResponse::username)
                .toList();
    }

    @Test
    void search_findsOtherUsersByPartOfTheirUsernameInAnyCase_AToZ() {
        User me = user("Janet");
        user("jane_doe");
        user("MaryJane");
        user("tom");

        assertThat(search("JAN", me)).containsExactly("jane_doe", "MaryJane");
    }

    @Test
    void search_treatsUnderscoreAndPercentAsPlainCharacters() {
        User me = user("me");
        user("jane_doe");
        user("janexdoe");

        assertThat(search("e_d", me)).containsExactly("jane_doe");
        assertThat(search("%", me)).isEmpty();
    }

}
