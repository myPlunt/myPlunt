export interface User {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
}

export interface UpdateAvatarRequest {
  key: string;
}

export interface UpdateProfileRequest {
  username: string;
  bio: string | null;
}

export interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
  city: string | null;
}

export interface CompleteOnboardingRequest {
  skipped: boolean;
}

export interface NotificationSettings {
  waterReminders: boolean;
  weatherAlerts: boolean;
  friendActivity: boolean;
  friendNudges: boolean;
  postInteractions: boolean;
  plantSitting: boolean;
}

export interface ChangeEmailRequest {
  email: string;
  currentPassword: string;
}

export interface UserSummary {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  /** request_sent means the signed-in user asked; null means neither asked. */
  friendship: 'friends' | 'request_sent' | 'request_received' | null;
}

// distanceKm is null when either of you hasn't set a location.
export interface Sitter {
  user: UserSummary;
  city: string | null;
  distanceKm: number | null;
  sameCity: boolean;
}

export interface FriendRequests {
  received: UserSummary[];
  sent: UserSummary[];
}
