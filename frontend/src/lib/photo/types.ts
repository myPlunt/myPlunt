/** Mirrors the backend's PhotoCategory: decides which folder of the bucket a photo goes to. */
export type PhotoCategory = 'AVATAR' | 'POST' | 'PLANT';

/** Mirrors UploadUrlResponse (POST /v1/photos/upload-url). */
export interface UploadUrlResponse {
  /** Presigned S3 PUT, valid for a few minutes. */
  uploadUrl: string;
  /** Storage key to send along with whatever the photo belongs to (e.g. CreatePlantRequest.photoKey). */
  key: string;
}
