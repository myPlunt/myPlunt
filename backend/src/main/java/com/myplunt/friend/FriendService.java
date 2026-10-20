package com.myplunt.friend;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.friend.dto.FriendRequestsResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserService;
import com.myplunt.user.dto.UserSummaryResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final AuditLog auditLog;

    public FriendService(
            FriendshipRepository friendshipRepository,
            UserRepository userRepository,
            UserService userService,
            AuditLog auditLog) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.auditLog = auditLog;
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFriends(UUID userId) {
        return summaries(friendshipRepository.findFriends(userId), "friends");
    }

    @Transactional(readOnly = true)
    public FriendRequestsResponse getRequests(UUID userId) {
        return new FriendRequestsResponse(
                summaries(friendshipRepository.findRequesters(userId), "request_received"),
                summaries(friendshipRepository.findRequested(userId), "request_sent"));
    }

    @Transactional
    public void accept(UUID userId, UUID requesterId) {
        pendingRequest(requesterId, userId).accept();
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_ACCEPTED, userId, userId, Map.of("other_user_id", requesterId));
    }

    // Deleted rather than marked declined: the pair index would otherwise stop either of them asking again.
    @Transactional
    public void decline(UUID userId, UUID requesterId) {
        friendshipRepository.delete(pendingRequest(requesterId, userId));
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_DECLINED, userId, userId, Map.of("other_user_id", requesterId));
    }

    @Transactional
    public void cancel(UUID userId, UUID receiverId) {
        friendshipRepository.delete(pendingRequest(userId, receiverId));
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_CANCELLED, userId, userId, Map.of("other_user_id", receiverId));
    }

    // Deleted like a declined request, so either of them can ask again later.
    @Transactional
    public void remove(UUID userId, UUID friendId) {
        friendshipRepository.delete(acceptedFriendship(userId, friendId));
        auditLog.recorded(AuditEvent.FRIEND_REMOVED, userId, userId, Map.of("other_user_id", friendId));
    }

    // Only friends see each other's garden and PluntDex. Strangers and pending requests get the
    // same 404 as an unknown user, so it doesn't tell them who exists.
    @Transactional(readOnly = true)
    public void requireFriends(UUID userId, UUID otherId) {
        acceptedFriendship(userId, otherId);
    }

    private Friendship acceptedFriendship(UUID userId, UUID otherId) {
        return friendshipRepository.findBetween(userId, List.of(otherId)).stream()
                .filter(f -> Friendship.ACCEPTED.equals(f.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("You're not friends with this user"));
    }

    // Looked up by direction, so accept/decline can't touch the user's own request and cancel can't touch one they received.
    private Friendship pendingRequest(UUID requesterId, UUID receiverId) {
        return friendshipRepository
                .findByRequesterIdAndReceiverIdAndStatus(requesterId, receiverId, Friendship.PENDING)
                .orElseThrow(() -> new IllegalStateException("No pending friend request with this user"));
    }

    private List<UserSummaryResponse> summaries(List<User> users, String friendship) {
        return users.stream().map(user -> userService.toSummary(user, friendship)).toList();
    }

    @Transactional
    public void sendRequest(UUID requesterId, UUID receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't add yourself as a friend");
        }
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        List<Friendship> existing = friendshipRepository.findBetween(requesterId, List.of(receiverId));
        if (!existing.isEmpty()) {
            Friendship friendship = existing.getFirst();
            String message = Friendship.ACCEPTED.equals(friendship.getStatus()) ? "You're already friends"
                    : friendship.getRequesterId().equals(requesterId) ? "Request already sent"
                    : receiver.getUsername() + " already sent you a request";
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }

        try {
            friendshipRepository.saveAndFlush(new Friendship(requesterId, receiverId));
        } catch (DataIntegrityViolationException e) {
            // Both sent a request at the same moment; the unique pair index let only one in.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already sent");
        }
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_SENT, requesterId, requesterId, Map.of("other_user_id", receiverId));
    }
}
