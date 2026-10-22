package com.myplunt.friend.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.util.List;

public record FriendRequestsResponse(List<UserSummaryResponse> received, List<UserSummaryResponse> sent) {
}
