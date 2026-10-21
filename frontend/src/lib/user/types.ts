/** Mirrors the backend's UserResponse (GET/PUT /v1/users/me). */
export interface User {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  /** Short-lived link to the profile picture; null when there is none. */
  avatarUrl: string | null;
  /** False until the user finishes or skips the tour; the tour resumes on sign-in until then. */
  onboardingCompleted: boolean;
}

/** Mirrors UpdateAvatarRequest (PUT /v1/users/me/avatar): the key of an uploaded AVATAR photo. */
export interface UpdateAvatarRequest {
  key: string;
}

/** Mirrors UpdateProfileRequest (PUT /v1/users/me). */
export interface UpdateProfileRequest {
  username: string;
  bio: string | null;
}

/** Mirrors UpdateLocationRequest (PUT /v1/users/me/location). city is null when the phone couldn't name it. */
export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  city: string | null;
}

/** Mirrors CompleteOnboardingRequest (PUT /v1/users/me/onboarding). skipped: left from the welcome page. */
export interface CompleteOnboardingRequest {
  skipped: boolean;
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
