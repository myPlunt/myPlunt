/** Mirrors the backend's PlanterResponse (POST /v1/planters). */
export interface Planter {
  id: string;
  name: string;
}

/** Mirrors CreatePlanterRequest (POST /v1/planters). */
export interface CreatePlanterRequest {
  name: string;
}
