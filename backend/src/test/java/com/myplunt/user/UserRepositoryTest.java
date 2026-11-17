package com.myplunt.user;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

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
    private JdbcTemplate jdbc;

    private User user(String username) {
        return userRepository.save(new User(username, username + "@example.com", "hashed"));
    }

    // Through UserService, which lowercases and escapes the query the way the repository expects.
    // No avatars here, so it never needs storage or the password encoder.
    private List<String> search(String query, User searcher) {
        return new UserService(userRepository, null, null, null, null)
                .searchUsers(searcher.getId(), query)
                .stream()
                .map(User::getUsername)
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

    // Account deletion relies on these cascades (V1, V5): nothing of the user may stay, also on a friend's side.
    @Test
    void delete_removesEveryRowOfTheUserIncludingWhatTheyLeftOnAFriendsPlantsAndPosts() {
        User jane = userRepository.saveAndFlush(new User("jane", "jane@example.com", "hashed"));
        User friend = userRepository.saveAndFlush(new User("friend", "friend@example.com", "hashed"));
        jdbc.update("INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?, ?, 'accepted')",
                jane.getId(), friend.getId());
        jdbc.update("INSERT INTO plants (owner_id, name) VALUES (?, 'Own fern')", jane.getId());
        UUID friendsPlant = jdbc.queryForObject(
                "INSERT INTO plants (owner_id, name) VALUES (?, 'Friend fern') RETURNING id", UUID.class, friend.getId());
        jdbc.update("INSERT INTO plant_photos (plant_id, uploaded_by, photo_key) VALUES (?, ?, 'plants/x/sitting.jpg')",
                friendsPlant, jane.getId());
        UUID friendsPost = jdbc.queryForObject(
                "INSERT INTO posts (user_id, post_type, body, is_resolved) VALUES (?, 'question', 'Yellow leaves?', false) RETURNING id",
                UUID.class, friend.getId());
        jdbc.update("INSERT INTO post_comments (post_id, author_id, body) VALUES (?, ?, 'Less water')",
                friendsPost, jane.getId());
        jdbc.update("INSERT INTO post_reactions (post_id, user_id, emoji) VALUES (?, ?, 'water')", friendsPost, jane.getId());
        jdbc.update("""
                INSERT INTO notifications (id, user_id, from_user_id, title, body, url)
                VALUES (gen_random_uuid(), ?, ?, 'New reply', 'jane replied on your question', '/')""",
                friend.getId(), jane.getId());

        userRepository.delete(jane);
        userRepository.flush();

        assertThat(count("SELECT count(*) FROM users WHERE id = ?", jane.getId())).isZero();
        assertThat(count("SELECT count(*) FROM friendships WHERE requester_id = ? OR receiver_id = ?", jane.getId(), jane.getId())).isZero();
        assertThat(count("SELECT count(*) FROM plants WHERE owner_id = ?", jane.getId())).isZero();
        assertThat(count("SELECT count(*) FROM plant_photos WHERE plant_id = ?", friendsPlant)).isZero();
        assertThat(count("SELECT count(*) FROM post_comments WHERE post_id = ?", friendsPost)).isZero();
        assertThat(count("SELECT count(*) FROM post_reactions WHERE post_id = ?", friendsPost)).isZero();
        assertThat(count("SELECT count(*) FROM notifications WHERE user_id = ?", friend.getId())).isZero();
        // The friend's own data stays.
        assertThat(count("SELECT count(*) FROM plants WHERE id = ?", friendsPlant)).isOne();
        assertThat(count("SELECT count(*) FROM posts WHERE id = ?", friendsPost)).isOne();
    }

    private int count(String sql, Object... args) {
        return jdbc.queryForObject(sql, Integer.class, args);
    }
}
