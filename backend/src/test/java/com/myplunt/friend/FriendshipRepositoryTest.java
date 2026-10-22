package com.myplunt.friend;

import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

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

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    // Rows saved in one test transaction all get the same now(), so the order is set by hand.
    private Friendship request(User from, User to, String status, int daysAgo) {
        Friendship friendship = friendshipRepository.saveAndFlush(new Friendship(from.getId(), to.getId()));
        jdbcTemplate.update(
                "update friendships set status = ?, created_at = now() - make_interval(days => ?) where id = ?",
                status, daysAgo, friendship.getId());
        return friendship;
    }

    private static List<String> usernames(List<User> users) {
        return users.stream().map(User::getUsername).toList();
    }

    @Test
    void requestQueries_listPendingRequestsEachWayNewestFirst() {
        User me = user("me");
        User oldAsker = user("oldasker");
        User newAsker = user("newasker");
        User asked = user("asked");
        User friend = user("friend");
        User elsewhere = user("elsewhere");
        request(oldAsker, me, Friendship.PENDING, 5);
        request(newAsker, me, Friendship.PENDING, 1);
        request(me, asked, Friendship.PENDING, 2);
        request(friend, me, Friendship.ACCEPTED, 3);
        request(elsewhere, asked, Friendship.PENDING, 1);

        assertThat(usernames(friendshipRepository.findRequesters(me.getId()))).containsExactly("newasker", "oldasker");
        assertThat(usernames(friendshipRepository.findRequested(me.getId()))).containsExactly("asked");
    }

    @Test
    void findFriends_listsAcceptedFriendsEitherWayAToZ() {
        User me = user("me");
        User zed = user("zed");
        User amy = user("amy");
        User pending = user("pending");
        User elsewhere = user("elsewhere");
        request(me, zed, Friendship.ACCEPTED, 1);
        request(amy, me, Friendship.ACCEPTED, 1);
        request(pending, me, Friendship.PENDING, 1);
        request(zed, elsewhere, Friendship.ACCEPTED, 1);

        assertThat(usernames(friendshipRepository.findFriends(me.getId()))).containsExactly("amy", "zed");
    }
}
