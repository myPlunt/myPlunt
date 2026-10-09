package com.myplunt.storage;

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

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucket;
    private final String prefix;
    private final Duration uploadUrlTtl;
    private final Duration readUrlTtl;
    private final long maxUploadSizeBytes;

    public StorageService(
            S3Client s3Client,
            S3Presigner s3Presigner,
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.prefix}") String prefix,
            @Value("${app.storage.upload-url-ttl-minutes}") long uploadUrlTtlMinutes,
            @Value("${app.storage.read-url-ttl-minutes}") long readUrlTtlMinutes,
            @Value("${app.storage.max-upload-size-bytes}") long maxUploadSizeBytes) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucket = bucket;
        this.prefix = prefix;
        this.uploadUrlTtl = Duration.ofMinutes(uploadUrlTtlMinutes);
        this.readUrlTtl = Duration.ofMinutes(readUrlTtlMinutes);
        this.maxUploadSizeBytes = maxUploadSizeBytes;
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
                .contentType(request.contentType())
                .build();

        String url = s3Presigner.presignPutObject(r -> r
                        .signatureDuration(uploadUrlTtl)
                        .putObjectRequest(putRequest))
                .url()
                .toString();

        return new UploadUrlResponse(url, key);
    }

    public void confirmUpload(String key) {
        HeadObjectResponse head;
        try {
            head = s3Client.headObject(r -> r.bucket(bucket).key(key));
        } catch (NoSuchKeyException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload not found for key: " + key);
        }

        if (head.contentLength() > maxUploadSizeBytes) {
            s3Client.deleteObject(r -> r.bucket(bucket).key(key));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file exceeds the size limit.");
        }
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

    private String buildKey(PhotoCategory category, UUID userId, String extension) {
        String categorySegment = category.name().toLowerCase() + "s"; // avatar -> avatars, post -> posts
        String base = "%s/%s/%s.%s".formatted(categorySegment, userId, UUID.randomUUID(), extension);
        return prefix.isBlank() ? base : prefix + "/" + base;
    }
}
