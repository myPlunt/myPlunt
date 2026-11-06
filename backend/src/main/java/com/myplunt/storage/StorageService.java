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
import software.amazon.awssdk.core.sync.RequestBody;
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

    // Uploads land under this prefix until confirmed, so a bucket lifecycle rule on it expires anything
    // never confirmed. A prefix, not an object tag: R2 supports neither tagging nor tag-filtered rules.
    static final String PENDING_PREFIX = "pending/";

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
                .key(PENDING_PREFIX + key)
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
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload not found for key: " + key);
        }

        String pendingKey = PENDING_PREFIX + key;
        HeadObjectResponse head;
        try {
            head = s3Client.headObject(r -> r.bucket(bucket).key(pendingKey));
        } catch (NoSuchKeyException e) {
            // Editing a plant re-sends its current photo key, which was confirmed (moved) earlier.
            if (exists(key)) {
                return;
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload not found for key: " + key);
        }

        if (head.contentLength() > maxUploadSizeBytes) {
            s3Client.deleteObject(r -> r.bucket(bucket).key(pendingKey));
            auditLog.rejected(AuditEvent.PHOTO_UPLOAD_REJECTED, userId, "too_large",
                    Map.of("photo_key", key, "size_bytes", head.contentLength()));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file exceeds the size limit.");
        }

        // Moves it out of pending/ so the lifecycle rule no longer expires it.
        s3Client.copyObject(r -> r
                .sourceBucket(bucket).sourceKey(pendingKey)
                .destinationBucket(bucket).destinationKey(key));
        s3Client.deleteObject(r -> r.bucket(bucket).key(pendingKey));
    }

    private boolean exists(String key) {
        try {
            s3Client.headObject(r -> r.bucket(bucket).key(key));
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    // Keys are "[prefix/]<category>/<userId>/<file>" - userId is always second to last.
    private boolean belongsToUser(String key, UUID userId) {
        String[] segments = key.split("/");
        return segments.length >= 2 && segments[segments.length - 2].equals(userId.toString());
    }

    // Stops e.g. a plant photo's key becoming a profile picture (and being deleted with it later).
    public boolean isCategory(String key, PhotoCategory category) {
        String[] segments = key.split("/");
        return segments.length >= 3 && segments[segments.length - 3].equals(categorySegment(category));
    }

    // Mints a link for any key: callers check visibility first.
    public String createReadUrl(String key) {
        GetObjectRequest getRequest = GetObjectRequest.builder().bucket(bucket).key(key).build();

        return s3Presigner.presignGetObject(r -> r
                        .signatureDuration(readUrlTtl)
                        .getObjectRequest(getRequest))
                .url()
                .toString();
    }

    // Next to the seed pictures ("species/<id>/seed.jpg"). Null when the picture isn't a JPEG or PNG or is too big.
    public String putSpeciesImage(UUID speciesId, byte[] bytes, String contentType) {
        String extension = ALLOWED_CONTENT_TYPES.get(contentType);
        if (extension == null || bytes.length > maxUploadSizeBytes) {
            return null;
        }
        String base = "species/%s/perenual.%s".formatted(speciesId, extension);
        String key = prefix.isBlank() ? base : prefix + "/" + base;
        s3Client.putObject(r -> r.bucket(bucket).key(key).contentType(contentType), RequestBody.fromBytes(bytes));
        return key;
    }

    public void deleteObject(String key) {
        s3Client.deleteObject(r -> r.bucket(bucket).key(key));
    }

    private String buildKey(PhotoCategory category, UUID userId, String extension) {
        String base = "%s/%s/%s.%s".formatted(categorySegment(category), userId, UUID.randomUUID(), extension);
        return prefix.isBlank() ? base : prefix + "/" + base;
    }

    private static String categorySegment(PhotoCategory category) {
        return category.name().toLowerCase() + "s";
    }
}
