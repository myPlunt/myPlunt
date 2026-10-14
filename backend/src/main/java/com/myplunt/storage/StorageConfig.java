package com.myplunt.storage;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.ExpirationStatus;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class StorageConfig {

    private static final Logger log = LoggerFactory.getLogger(StorageConfig.class);

    @Bean
    public S3Client s3Client(
            @Value("${app.storage.endpoint}") String endpoint,
            @Value("${app.storage.access-key}") String accessKey,
            @Value("${app.storage.secret-key}") String secretKey) {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(
            @Value("${app.storage.endpoint}") String endpoint,
            @Value("${app.storage.access-key}") String accessKey,
            @Value("${app.storage.secret-key}") String secretKey) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    // StorageService tags every presigned upload "pending=true" and strips it on confirm, so
    // this rule sweeps up objects whose uploader never confirmed (abandoned/forgotten uploads).
    // Dev-only, same as the rest of this runner: staging/prod buckets are provisioned externally,
    // and PutLifecycleConfiguration is a bucket-admin permission the app has no other need for.
    private static final int PENDING_UPLOAD_EXPIRATION_DAYS = 1;

    // Seed storage key (without the prefix) -> image URL, for the keys the db/seed SQL points at.
    // Downloaded instead of committed, so the repo has no image files.
    private static final String SEED_IMAGES = "db/seed/seed-images.csv";

    // A 1x1 transparent PNG, stored when a download fails (e.g. offline) so the key still exists.
    // The app then shows its own placeholder icon through it.
    private static final byte[] PLACEHOLDER_IMAGE = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=");

    // Anything this small is a placeholder from an earlier failed download, so it's retried.
    private static final long PLACEHOLDER_MAX_BYTES = 1024;

    private static final int DOWNLOAD_ATTEMPTS = 3;

    @Bean
    @Profile("dev")
    public ApplicationRunner ensureDevBucketExists(
            S3Client s3Client,
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.prefix}") String prefix) {
        return args -> {
            try {
                s3Client.createBucket(r -> r.bucket(bucket));
            } catch (BucketAlreadyOwnedByYouException ignored) {
                // already set up from a previous run
            }

            s3Client.putBucketLifecycleConfiguration(r -> r
                    .bucket(bucket)
                    .lifecycleConfiguration(c -> c.rules(rule -> rule
                            .id("expire-unconfirmed-uploads")
                            .status(ExpirationStatus.ENABLED)
                            .filter(f -> f.tag(t -> t.key("pending").value("true")))
                            .expiration(e -> e.days(PENDING_UPLOAD_EXPIRATION_DAYS)))));

            // After the bucket exists, so this one runner covers dev, while staging gets its own below.
            startSeedImageUpload(s3Client, bucket, prefix);
        };
    }

    // Staging loads the db/seed data too, so its bucket needs the photos as well. Its bucket is
    // provisioned externally, so unlike dev this only uploads the photos.
    @Bean
    @Profile("staging & !dev")
    public ApplicationRunner uploadStagingSeedImages(
            S3Client s3Client,
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.prefix}") String prefix) {
        return args -> startSeedImageUpload(s3Client, bucket, prefix);
    }

    // In the background: the first start downloads a few dozen photos, which shouldn't hold up startup.
    private void startSeedImageUpload(S3Client s3Client, String bucket, String prefix) {
        Thread.ofVirtual().name("seed-images").start(() -> uploadSeedImages(s3Client, bucket, prefix));
    }

    private void uploadSeedImages(S3Client s3Client, String bucket, String prefix) {
        HttpClient http = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        // Several keys share a photo (a plant and its species), so each URL is downloaded once.
        Map<String, Image> downloads = new HashMap<>();
        try {
            String csv = new ClassPathResource(SEED_IMAGES).getContentAsString(StandardCharsets.UTF_8);
            for (String line : csv.lines().toList()) {
                if (line.isBlank() || line.startsWith("#")) {
                    continue;
                }
                String[] keyAndUrl = line.split(",", 2);
                // Same prefixing as StorageService.buildKey, and as V9 does with the storagePrefix placeholder.
                String key = prefix.isBlank() ? keyAndUrl[0] : prefix + "/" + keyAndUrl[0];
                if (hasRealImage(s3Client, bucket, key)) {
                    continue;
                }
                Image image = downloads.computeIfAbsent(keyAndUrl[1], url -> download(http, url));
                s3Client.putObject(r -> r.bucket(bucket).key(key).contentType(image.contentType()),
                        RequestBody.fromBytes(image.bytes()));
            }
        } catch (IOException | RuntimeException e) {
            StructuredLog.warning(log, LogEvent.SEED_IMAGE_UNAVAILABLE, Map.of("reason", e.getClass().getSimpleName()));
        }
    }

    private boolean hasRealImage(S3Client s3Client, String bucket, String key) {
        try {
            return s3Client.headObject(r -> r.bucket(bucket).key(key)).contentLength() > PLACEHOLDER_MAX_BYTES;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    private Image download(HttpClient http, String url) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                // Wikimedia refuses requests without a descriptive User-Agent.
                .header("User-Agent", "myplunt-dev-seed/1.0 (dev seed data)")
                .timeout(Duration.ofSeconds(20))
                .build();
        // Wikimedia rate-limits bursts like this one, so a failure gets a couple of slower retries.
        for (int attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
            try {
                HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
                String contentType = response.headers().firstValue("Content-Type").orElse("");
                if (response.statusCode() == 200 && contentType.startsWith("image/")) {
                    return new Image(response.body(), contentType);
                }
                StructuredLog.warning(log, LogEvent.SEED_IMAGE_UNAVAILABLE, Map.of(
                        "url", url, "status", response.statusCode(), "content_type", contentType, "attempt", attempt));
                if (attempt < DOWNLOAD_ATTEMPTS) {
                    Thread.sleep(Duration.ofSeconds(2L * attempt));
                }
            } catch (IOException e) {
                StructuredLog.warning(log, LogEvent.SEED_IMAGE_UNAVAILABLE, Map.of(
                        "url", url, "reason", e.getClass().getSimpleName(), "attempt", attempt));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        // A fallback, so a warning: the garden shows a blank photo until the next start retries it.
        StructuredLog.warning(log, LogEvent.SEED_IMAGE_PLACEHOLDER_USED, Map.of("url", url));
        return new Image(PLACEHOLDER_IMAGE, "image/png");
    }

    private record Image(byte[] bytes, String contentType) {
    }
}
