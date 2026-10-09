package com.myplunt.storage;

import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.storage.dto.UploadUrlRequest;
import com.myplunt.storage.dto.UploadUrlResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.net.URI;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StorageServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private PresignedPutObjectRequest presignedPutObjectRequest;

    @Mock
    private PresignedGetObjectRequest presignedGetObjectRequest;

    private StorageService storageService() {
        return new StorageService(s3Client, s3Presigner, "myplunt-dev", "", 5, 15, 5_242_880);
    }

    @Test
    void createUploadUrl_buildsKeyUnderCategoryAndUserId() throws Exception {
        UUID userId = UUID.randomUUID();
        when(s3Presigner.presignPutObject(any(java.util.function.Consumer.class)))
                .thenReturn(presignedPutObjectRequest);
        when(presignedPutObjectRequest.url()).thenReturn(URI.create("http://localhost:9000/signed").toURL());

        UploadUrlResponse response = storageService()
                .createUploadUrl(userId, new UploadUrlRequest(PhotoCategory.AVATAR, "image/jpeg"));

        assertThat(response.uploadUrl()).isEqualTo("http://localhost:9000/signed");
        assertThat(response.key()).startsWith("avatars/" + userId + "/").endsWith(".jpg");
    }

    @Test
    void createUploadUrl_appliesPrefixWhenConfigured() throws Exception {
        when(s3Presigner.presignPutObject(any(java.util.function.Consumer.class)))
                .thenReturn(presignedPutObjectRequest);
        when(presignedPutObjectRequest.url()).thenReturn(URI.create("http://localhost:9000/signed").toURL());

        StorageService staging = new StorageService(s3Client, s3Presigner, "myplunt", "staging", 5, 15, 5_242_880);

        UploadUrlResponse response = staging.createUploadUrl(UUID.randomUUID(), new UploadUrlRequest(PhotoCategory.POST, "image/png"));

        assertThat(response.key()).startsWith("staging/posts/");
    }

    @Test
    void createUploadUrl_rejectsUnsupportedContentType() {
        assertThatThrownBy(() -> storageService()
                        .createUploadUrl(UUID.randomUUID(), new UploadUrlRequest(PhotoCategory.AVATAR, "image/gif")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Unsupported content type");
    }

    @Test
    void confirmUpload_throwsNotFoundWhenKeyMissing() {
        UUID userId = UUID.randomUUID();
        when(s3Client.headObject(any(java.util.function.Consumer.class))).thenThrow(NoSuchKeyException.builder().build());

        assertThatThrownBy(() -> storageService().confirmUpload(userId, "avatars/" + userId + "/missing.jpg"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void confirmUpload_throwsNotFoundWhenKeyBelongsToDifferentUser() {
        UUID userId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        assertThatThrownBy(() -> storageService().confirmUpload(userId, "avatars/" + otherUserId + "/file.jpg"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");

        verifyNoInteractions(s3Client);
    }

    @Test
    void confirmUpload_deletesAndThrowsWhenTooLarge() {
        UUID userId = UUID.randomUUID();
        when(s3Client.headObject(any(java.util.function.Consumer.class)))
                .thenReturn(HeadObjectResponse.builder().contentLength(10_000_000L).build());
        when(s3Client.deleteObject(any(java.util.function.Consumer.class))).thenReturn(DeleteObjectResponse.builder().build());

        assertThatThrownBy(() -> storageService().confirmUpload(userId, "avatars/" + userId + "/big.jpg"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("exceeds");

        verify(s3Client).deleteObject(any(java.util.function.Consumer.class));
    }

    @Test
    void confirmUpload_succeedsAndClearsPendingTagWhenWithinLimit() {
        UUID userId = UUID.randomUUID();
        when(s3Client.headObject(any(java.util.function.Consumer.class)))
                .thenReturn(HeadObjectResponse.builder().contentLength(1_000L).build());

        storageService().confirmUpload(userId, "avatars/" + userId + "/fine.jpg");

        verify(s3Client).deleteObjectTagging(any(java.util.function.Consumer.class));
    }

    @Test
    void createReadUrl_returnsPresignedUrlForKey() throws Exception {
        when(s3Presigner.presignGetObject(any(java.util.function.Consumer.class)))
                .thenReturn(presignedGetObjectRequest);
        when(presignedGetObjectRequest.url()).thenReturn(URI.create("http://localhost:9000/read-signed").toURL());

        String url = storageService().createReadUrl("avatars/some/key.jpg");

        assertThat(url).isEqualTo("http://localhost:9000/read-signed");
    }
}
