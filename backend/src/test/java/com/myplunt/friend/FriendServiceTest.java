package com.myplunt.friend;

import com.myplunt.common.logging.AuditLog;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FriendServiceTest {

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLog auditLog;

    private final UUID janeId = UUID.randomUUID();
    private final UUID tomId = UUID.randomUUID();

    // Not in @BeforeEach: the self and unknown-user tests never look tom up, and strict stubs would fail them.
    private void tomExists() {
        User tom = new User("tom", "tom@example.com", "hashed");
        ReflectionTestUtils.setField(tom, "id", tomId);
        when(userRepository.findById(tomId)).thenReturn(Optional.of(tom));
    }

    private FriendService friendService() {
        return new FriendService(friendshipRepository, userRepository, auditLog);
    }

    private void assertConflict(String message) {
        tomExists();
        assertThatThrownBy(() -> friendService().sendRequest(janeId, tomId))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getReason()).isEqualTo(message);
                });
    }

    @Test
    void sendRequest_savesAPendingRequestFromTheSender() {
        tomExists();
        friendService().sendRequest(janeId, tomId);

        ArgumentCaptor<Friendship> saved = ArgumentCaptor.forClass(Friendship.class);
        verify(friendshipRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getRequesterId()).isEqualTo(janeId);
        assertThat(saved.getValue().getReceiverId()).isEqualTo(tomId);
        assertThat(saved.getValue().getStatus()).isEqualTo(Friendship.PENDING);
    }

    @Test
    void sendRequest_rejectsAddingYourself() {
        assertThatThrownBy(() -> friendService().sendRequest(tomId, tomId))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void sendRequest_conflictsWhenAlreadyFriends() {
        Friendship friends = new Friendship(tomId, janeId);
        ReflectionTestUtils.setField(friends, "status", Friendship.ACCEPTED);
        when(friendshipRepository.findBetween(janeId, List.of(tomId))).thenReturn(List.of(friends));

        assertConflict("You're already friends");
        verify(friendshipRepository, never()).saveAndFlush(any());
    }

    @Test
    void sendRequest_conflictsWhenTheyAlreadyAsked() {
        when(friendshipRepository.findBetween(janeId, List.of(tomId)))
                .thenReturn(List.of(new Friendship(tomId, janeId)));

        assertConflict("tom already sent you a request");
    }

}
