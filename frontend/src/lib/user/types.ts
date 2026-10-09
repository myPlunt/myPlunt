/** Mirrors the backend's UserResponse (GET /v1/users/me). */
export interface User {
  id: string;
  username: string;
  email: string;
}
