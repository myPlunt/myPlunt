package com.myplunt.storage;

import com.myplunt.constants.ApiPaths;
import com.myplunt.storage.dto.ConfirmUploadRequest;
import com.myplunt.storage.dto.UploadUrlRequest;
import com.myplunt.storage.dto.UploadUrlResponse;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PhotoController {

    private final StorageService storageService;

    public PhotoController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping(ApiPaths.Photos.UPLOAD_URL)
    public UploadUrlResponse createUploadUrl(
            @AuthenticationPrincipal User user, @Valid @RequestBody UploadUrlRequest request) {
        return storageService.createUploadUrl(user.getId(), request);
    }

    @PostMapping(ApiPaths.Photos.CONFIRM)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmUpload(@Valid @RequestBody ConfirmUploadRequest request) {
        storageService.confirmUpload(request.key());
    }
}
