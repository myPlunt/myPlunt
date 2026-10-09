package com.myplunt.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.ExpirationStatus;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.util.Base64;
import java.util.List;

@Configuration
public class StorageConfig {

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

    // A 1x1 transparent PNG - real bytes aren't needed, the seed objects just have to
    // exist so createReadUrl(key) has something real to presign against in dev.
    private static final byte[] SEED_IMAGE_BYTES = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=");

    // Keys mirror the fixed UUIDs in db/seed/V2__seed_dev_data.sql, so avatar_key/photo_key
    // there resolve to real objects instead of placehold.co strings that aren't actual keys.
    private static final List<String> SEED_AVATAR_KEYS = List.of(
            "avatars/10000000-0000-0000-0000-000000000001/seed.png",
            "avatars/10000000-0000-0000-0000-000000000002/seed.png",
            "avatars/10000000-0000-0000-0000-000000000003/seed.png");
    private static final String SEED_POST_PHOTO_KEY = "posts/10000000-0000-0000-0000-000000000001/seed.png";

    @Bean
    @Profile("dev")
    public ApplicationRunner ensureDevBucketExists(S3Client s3Client, @Value("${app.storage.bucket}") String bucket) {
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

            for (String key : SEED_AVATAR_KEYS) {
                putSeedImage(s3Client, bucket, key);
            }
            putSeedImage(s3Client, bucket, SEED_POST_PHOTO_KEY);
        };
    }

    private void putSeedImage(S3Client s3Client, String bucket, String key) {
        s3Client.putObject(
                r -> r.bucket(bucket).key(key).contentType("image/png"),
                RequestBody.fromBytes(SEED_IMAGE_BYTES));
    }
}
