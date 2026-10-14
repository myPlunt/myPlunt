/** Mirrors the backend's UserResponse (GET/PUT /v1/users/me). */
export interface User {
  id: string;
  username: string;
  email: string;
  bio: string | null;
}

/** Mirrors UpdateProfileRequest (PUT /v1/users/me). */
export interface UpdateProfileRequest {
  username: string;
  bio: string | null;
}

/** Mirrors ChangeEmailRequest (PUT /v1/users/me/email). */
export interface ChangeEmailRequest {
  email: string;
  currentPassword: string;
}

/** Mirrors UserSummaryResponse (GET /v1/users/search): another user, without their email. */
export interface UserSummary {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  /** How they relate to the signed-in user: request_sent means the signed-in user asked. null when neither asked. */
  friendship: 'friends' | 'request_sent' | 'request_received' | null;
}

/** Mirrors FriendRequestsResponse (GET /v1/friends/requests): requests still waiting, newest first. */
export interface FriendRequests {
  received: UserSummary[];
  sent: UserSummary[];
}
