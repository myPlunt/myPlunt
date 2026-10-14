import { ApiError, apiFetch } from '@/lib/auth/api-client';
import { logAction, logError } from '@/lib/logger';
import type { PhotoCategory, UploadUrlResponse } from '@/lib/photo/types';
import { createRequestId } from '@/lib/request-id';

// The backend only accepts JPEG and PNG; usePhotoUpload always turns photos into JPEG.
const CONTENT_TYPE = 'image/jpeg';

const UPLOAD_FAILED_DETAIL = "Couldn't upload the photo. Please try again.";

/**
 * Uploads a local JPEG straight to storage and returns its key. The backend only
 * hands out a presigned PUT; the photo itself never goes through it. The upload stays
 * "pending" until something that uses the key (e.g. creating a plant) confirms it, and
 * storage deletes pending uploads after a day.
 */
export async function uploadPhoto(localUri: string, category: PhotoCategory): Promise<string> {
  const requestId = createRequestId();
  logAction('photo_upload_submitted', { requestId, context: { category } });
  const { uploadUrl, key } = await apiFetch<UploadUrlResponse>('/v1/photos/upload-url', {
    method: 'POST',
    body: { category, contentType: CONTENT_TYPE },
    requestId,
  });

  let response: Response;
  try {
    const file = await (await fetch(localUri)).blob();
    response = await fetch(uploadUrl, {
      method: 'PUT',
      // Both headers are part of the presigned signature, so they must match it exactly.
      headers: { 'Content-Type': CONTENT_TYPE, 'x-amz-tagging': 'pending=true' },
      body: file,
    });
  } catch (err) {
    logError('photo_upload_failed', err, { requestId, context: { status: 0 } });
    throw new ApiError(0, 'Photo upload failed', { detail: UPLOAD_FAILED_DETAIL });
  }
  if (!response.ok) {
    // Storage's own error body is XML about signatures; the status says enough.
    logError('photo_upload_failed', undefined, { requestId, context: { status: response.status } });
    throw new ApiError(response.status, 'Photo upload failed', { detail: UPLOAD_FAILED_DETAIL });
  }
  return key;
}
