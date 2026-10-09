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
