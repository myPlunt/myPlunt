package com.myplunt.friend;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
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
    private final AuditLog auditLog;

    public FriendService(FriendshipRepository friendshipRepository, UserRepository userRepository, AuditLog auditLog) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.auditLog = auditLog;
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
