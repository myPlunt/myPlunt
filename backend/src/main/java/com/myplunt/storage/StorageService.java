package com.myplunt.storage;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.storage.dto.UploadUrlRequest;
import com.myplunt.storage.dto.UploadUrlResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@Service
public class StorageService {

    private static final Map<String, String> ALLOWED_CONTENT_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png");

    // Signed into the presigned PUT, so the uploader's PUT must send this exact header.
    // Lets a bucket lifecycle rule expire anything never confirmed.
    private static final String PENDING_UPLOAD_TAGGING = "pending=true";

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucket;
    private final String prefix;
    private final Duration uploadUrlTtl;
    private final Duration readUrlTtl;
    private final long maxUploadSizeBytes;
    private final AuditLog auditLog;

    public StorageService(
            S3Client s3Client,
            S3Presigner s3Presigner,
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.prefix}") String prefix,
            @Value("${app.storage.upload-url-ttl-minutes}") long uploadUrlTtlMinutes,
            @Value("${app.storage.read-url-ttl-minutes}") long readUrlTtlMinutes,
            @Value("${app.storage.max-upload-size-bytes}") long maxUploadSizeBytes,
            AuditLog auditLog) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucket = bucket;
        this.prefix = prefix;
        this.uploadUrlTtl = Duration.ofMinutes(uploadUrlTtlMinutes);
        this.readUrlTtl = Duration.ofMinutes(readUrlTtlMinutes);
        this.maxUploadSizeBytes = maxUploadSizeBytes;
        this.auditLog = auditLog;
    }

    public UploadUrlResponse createUploadUrl(UUID userId, UploadUrlRequest request) {
        String extension = ALLOWED_CONTENT_TYPES.get(request.contentType());
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported content type: " + request.contentType());
        }

        String key = buildKey(request.category(), userId, extension);

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .tagging(PENDING_UPLOAD_TAGGING)
                .build();

        String url = s3Presigner.presignPutObject(r -> r
                        .signatureDuration(uploadUrlTtl)
                        .putObjectRequest(putRequest))
                .url()
                .toString();

        return new UploadUrlResponse(url, key);
    }

    public void confirmUpload(UUID userId, String key) {
        if (!belongsToUser(key, userId)) {
            // Don't distinguish "not yours" from "doesn't exist" - same as a missing key.
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload not found for key: " + key);
        }

        HeadObjectResponse head;
        try {
            head = s3Client.headObject(r -> r.bucket(bucket).key(key));
        } catch (NoSuchKeyException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload not found for key: " + key);
        }

        if (head.contentLength() > maxUploadSizeBytes) {
            s3Client.deleteObject(r -> r.bucket(bucket).key(key));
            auditLog.rejected(AuditEvent.PHOTO_UPLOAD_REJECTED, userId, "too_large",
                    Map.of("photo_key", key, "size_bytes", head.contentLength()));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file exceeds the size limit.");
        }

        // Clears the pending tag so the lifecycle rule no longer expires this object.
        s3Client.deleteObjectTagging(r -> r.bucket(bucket).key(key));
    }

    // Keys are "[prefix/]<category>/<userId>/<file>" - userId is always second to last.
    private boolean belongsToUser(String key, UUID userId) {
        String[] segments = key.split("/");
        return segments.length >= 2 && segments[segments.length - 2].equals(userId.toString());
    }

    // Caller (post/profile service) is responsible for checking visibility/ownership
    // before calling this - this just mints a URL for whatever key it's given.
    public String createReadUrl(String key) {
        GetObjectRequest getRequest = GetObjectRequest.builder().bucket(bucket).key(key).build();

        return s3Presigner.presignGetObject(r -> r
                        .signatureDuration(readUrlTtl)
                        .getObjectRequest(getRequest))
                .url()
                .toString();
    }

    public void deleteObject(String key) {
        s3Client.deleteObject(r -> r.bucket(bucket).key(key));
    }

    private String buildKey(PhotoCategory category, UUID userId, String extension) {
        String categorySegment = category.name().toLowerCase() + "s"; // avatar -> avatars, post -> posts
        String base = "%s/%s/%s.%s".formatted(categorySegment, userId, UUID.randomUUID(), extension);
        return prefix.isBlank() ? base : prefix + "/" + base;
    }
}
