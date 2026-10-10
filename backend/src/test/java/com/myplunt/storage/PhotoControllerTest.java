package com.myplunt.storage;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.storage.dto.ConfirmUploadRequest;
import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.storage.dto.UploadUrlRequest;
import com.myplunt.storage.dto.UploadUrlResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@WebMvcTest(PhotoController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class PhotoControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private StorageService storageService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private void authenticateAs(UUID userId) {
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", userId);
        when(jwtService.parseAndValidate("valid-token")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    }

    @Test
    void createUploadUrl_returnsUrlAndKeyWhenAuthenticated() {
        UUID userId = UUID.randomUUID();
        authenticateAs(userId);
        when(storageService.createUploadUrl(eq(userId), any()))
                .thenReturn(new UploadUrlResponse("http://localhost:9000/signed", "avatars/" + userId + "/abc.jpg"));

        restTestClient.post().uri("/v1/photos/upload-url")
                .header("Authorization", "Bearer valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UploadUrlRequest(PhotoCategory.AVATAR, "image/jpeg"))
                .exchange()
                .expectStatus().isOk()
                .expectBody(UploadUrlResponse.class)
                .isEqualTo(new UploadUrlResponse("http://localhost:9000/signed", "avatars/" + userId + "/abc.jpg"));
    }

    @Test
    void createUploadUrl_rejectsUnauthenticatedRequest() {
        restTestClient.post().uri("/v1/photos/upload-url")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UploadUrlRequest(PhotoCategory.AVATAR, "image/jpeg"))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void confirmUpload_returnsNoContentWhenKeyValid() {
        UUID userId = UUID.randomUUID();
        authenticateAs(userId);

        restTestClient.post().uri("/v1/photos/confirm")
                .header("Authorization", "Bearer valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ConfirmUploadRequest("avatars/" + userId + "/key.jpg"))
                .exchange()
                .expectStatus().isNoContent();
    }

    @Test
    void confirmUpload_propagatesNotFoundForMissingKey() {
        UUID userId = UUID.randomUUID();
        authenticateAs(userId);
        String key = "avatars/" + userId + "/missing.jpg";
        org.mockito.Mockito.doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND))
                .when(storageService).confirmUpload(userId, key);

        restTestClient.post().uri("/v1/photos/confirm")
                .header("Authorization", "Bearer valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ConfirmUploadRequest(key))
                .exchange()
                .expectStatus().isNotFound();
    }
}
