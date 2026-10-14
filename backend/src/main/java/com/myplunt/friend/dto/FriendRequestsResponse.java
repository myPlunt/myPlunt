package com.myplunt.friend.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.util.List;

// Requests still waiting for an answer: received from others and sent by the user, newest first.
public record FriendRequestsResponse(List<UserSummaryResponse> received, List<UserSummaryResponse> sent) {
}
