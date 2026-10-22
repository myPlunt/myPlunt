import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import { createRequestId } from '@/lib/request-id';
import type { CompleteOnboardingRequest } from '@/lib/user/types';

export async function completeOnboarding(request: CompleteOnboardingRequest): Promise<void> {
  const requestId = createRequestId();
  logAction('onboarding_complete_submitted', { requestId });
  return apiFetch<void>('/v1/users/me/onboarding', { method: 'PUT', body: request, requestId });
}
