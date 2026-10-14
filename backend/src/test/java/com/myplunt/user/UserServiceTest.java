package com.myplunt.user;

import com.myplunt.common.logging.AuditLog;
import com.myplunt.friend.Friendship;
import com.myplunt.friend.FriendshipRepository;
import com.myplunt.storage.StorageService;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
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
class UserServiceTest {

    @Mock
    private AuditLog auditLog;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private StorageService storageService;

    @Mock
    private FriendshipRepository friendshipRepository;

    private final UUID id = UUID.randomUUID();
    private User jane;

    @BeforeEach
    void setUp() {
        jane = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(jane, "id", id);
    }

    private UserService userService() {
        return new UserService(userRepository, passwordEncoder, storageService, friendshipRepository, auditLog);
    }

    @Test
    void toResponse_mapsIdUsernameEmailAndBioOnly() {
        jane.setBio("Fern collector");

        UserResponse response = userService().toResponse(jane);

        assertThat(response).isEqualTo(new UserResponse(id, "jane", "jane@example.com", "Fern collector"));
    }

    @Test
    void updateProfile_updatesUsernameAndTrimmedBio() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(userRepository.findByUsername("janey")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService().updateProfile(id, new UpdateProfileRequest("janey", "  Fern collector  "));

        assertThat(response).isEqualTo(new UserResponse(id, "janey", "jane@example.com", "Fern collector"));
    }

    @Test
    void updateProfile_storesBlankBioAsNull() {
        jane.setBio("old bio");
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService().updateProfile(id, new UpdateProfileRequest("jane", "   "));

        assertThat(response.bio()).isNull();
    }

    @Test
    void updateProfile_allowsChangingOnlyTheCaseOfTheOwnUsername() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService().updateProfile(id, new UpdateProfileRequest("Jane", null));

        assertThat(response.username()).isEqualTo("Jane");
        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    void updateProfile_rejectsUsernameTakenByAnotherUser() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(userRepository.findByUsername("taken"))
                .thenReturn(Optional.of(new User("taken", "other@example.com", "x")));

        assertThatThrownBy(() -> userService().updateProfile(id, new UpdateProfileRequest("taken", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Username already taken");
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_throwsWhenUserNoLongerExists() {
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService().updateProfile(id, new UpdateProfileRequest("jane", null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("User not found");
    }

    @Test
    void changeEmail_changesEmailWhenCurrentPasswordMatches() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService().changeEmail(id, new ChangeEmailRequest("new@example.com", "password123"));

        assertThat(response.email()).isEqualTo("new@example.com");
    }

    @Test
    void changeEmail_rejectsWrongPassword() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> userService().changeEmail(id, new ChangeEmailRequest("new@example.com", "wrong")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN))
                .hasMessageContaining("Current password is incorrect");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changeEmail_rejectsEmailTakenByAnotherUser() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(userRepository.findByEmail("taken@example.com"))
                .thenReturn(Optional.of(new User("other", "taken@example.com", "x")));

        assertThatThrownBy(() -> userService().changeEmail(id, new ChangeEmailRequest("taken@example.com", "password123")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email already registered");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changeEmail_allowsChangingOnlyTheCaseOfTheOwnEmail() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService().changeEmail(id, new ChangeEmailRequest("Jane@Example.com", "password123"));

        assertThat(response.email()).isEqualTo("Jane@Example.com");
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void search_returnsOtherUsersWithoutTheirEmail() {
        jane.setBio("Fern collector");
        jane.setAvatarKey("avatars/a.jpg");
        UUID searcherId = UUID.randomUUID();
        when(userRepository.search("jan", searcherId, Limit.of(20))).thenReturn(List.of(jane));
        when(storageService.createReadUrl("avatars/a.jpg")).thenReturn("https://storage.test/a.jpg");

        assertThat(userService().search(searcherId, " JAN "))
                .containsExactly(new UserSummaryResponse(id, "jane", "Fern collector", "https://storage.test/a.jpg", null));
    }

    @Test
    void search_saysHowEachResultRelatesToTheSearcher() {
        UUID searcherId = UUID.randomUUID();
        User friend = user("friend");
        User asked = user("asked");
        User asker = user("asker");
        User stranger = user("stranger");
        Friendship accepted = new Friendship(friend.getId(), searcherId);
        ReflectionTestUtils.setField(accepted, "status", Friendship.ACCEPTED);
        when(userRepository.search("a", searcherId, Limit.of(20))).thenReturn(List.of(friend, asked, asker, stranger));
        when(friendshipRepository.findBetween(
                        searcherId, List.of(friend.getId(), asked.getId(), asker.getId(), stranger.getId())))
                .thenReturn(List.of(
                        accepted,
                        new Friendship(searcherId, asked.getId()),
                        new Friendship(asker.getId(), searcherId)));

        assertThat(userService().search(searcherId, "a"))
                .extracting(UserSummaryResponse::friendship)
                .containsExactly("friends", "request_sent", "request_received", null);
    }

    @Test
    void getSummary_returnsTheUserAndHowTheyRelateToTheViewer() {
        UUID viewerId = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(friendshipRepository.findBetween(viewerId, List.of(id)))
                .thenReturn(List.of(new Friendship(id, viewerId)));

        assertThat(userService().getSummary(viewerId, id))
                .isEqualTo(new UserSummaryResponse(id, "jane", null, null, "request_received"));
    }

    @Test
    void getSummary_hasNoFriendshipWhenNeitherAsked() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));

        assertThat(userService().getSummary(UUID.randomUUID(), id).friendship()).isNull();
    }

    @Test
    void getSummary_failsForAnUnknownUser() {
        UUID ghostId = UUID.randomUUID();

        assertThatThrownBy(() -> userService().getSummary(id, ghostId)).isInstanceOf(IllegalStateException.class);
    }

    private static User user(String username) {
        User user = new User(username, username + "@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        return user;
    }

    @Test
    void search_escapesLikeWildcards() {
        UUID searcherId = UUID.randomUUID();

        userService().search(searcherId, "a_b%c\\d");

        verify(userRepository).search("a\\_b\\%c\\\\d", searcherId, Limit.of(20));
    }

    @Test
    void search_returnsNothingForABlankOrTooLongQuery() {
        assertThat(userService().search(id, "  ")).isEmpty();
        assertThat(userService().search(id, "a".repeat(31))).isEmpty();
        verifyNoInteractions(userRepository);
    }
}
