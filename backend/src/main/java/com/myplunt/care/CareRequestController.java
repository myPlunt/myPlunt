package com.myplunt.care;

import com.myplunt.care.dto.CareRequestsResponse;
import com.myplunt.care.dto.SendCareRequest;
import com.myplunt.constants.ApiPaths;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class CareRequestController {

    private final CareRequestService careRequestService;

    public CareRequestController(CareRequestService careRequestService) {
        this.careRequestService = careRequestService;
    }

    @PostMapping(ApiPaths.CareRequests.BASE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void send(@AuthenticationPrincipal User principal, @Valid @RequestBody SendCareRequest request) {
        careRequestService.send(principal.getId(), request);
    }

    @GetMapping(ApiPaths.CareRequests.BASE)
    public CareRequestsResponse requests(@AuthenticationPrincipal User principal) {
        return careRequestService.getRequests(principal.getId());
    }

    @PostMapping(ApiPaths.CareRequests.ACCEPT)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        careRequestService.accept(principal.getId(), userId);
    }

    @PostMapping(ApiPaths.CareRequests.DECLINE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decline(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        careRequestService.decline(principal.getId(), userId);
    }
}
