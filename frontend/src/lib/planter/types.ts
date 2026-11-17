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
