/** Same limit as the backend's planter requests. */
export const PLANTER_NAME_MAX_LENGTH = 30;
export const PLANTER_NAME_TOO_LONG = `Name must be at most ${PLANTER_NAME_MAX_LENGTH} characters.`;

/** Only plants in an outdoor planter get weather alerts. */
export interface Planter {
  id: string;
  name: string;
  outdoor: boolean;
}

export interface CreatePlanterRequest {
  name: string;
  outdoor: boolean;
}

export interface UpdatePlanterRequest {
  name: string;
  outdoor: boolean;
}
