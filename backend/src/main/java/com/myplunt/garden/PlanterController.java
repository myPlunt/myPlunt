package com.myplunt.garden;

import com.myplunt.constants.ApiPaths;
import com.myplunt.garden.dto.CreatePlanterRequest;
import com.myplunt.garden.dto.PlanterResponse;
import com.myplunt.garden.dto.UpdatePlanterRequest;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class PlanterController {

    private final PlanterService planterService;

    public PlanterController(PlanterService planterService) {
        this.planterService = planterService;
    }

    // The new planter always belongs to the signed-in user (JwtAuthFilter's principal).
    @PostMapping(ApiPaths.Planters.BASE)
    @ResponseStatus(HttpStatus.CREATED)
    public PlanterResponse create(
            @AuthenticationPrincipal User principal, @Valid @RequestBody CreatePlanterRequest request) {
        return planterService.create(principal.getId(), request);
    }

    @PutMapping(ApiPaths.Planters.BY_ID)
    public PlanterResponse rename(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID planterId,
            @Valid @RequestBody UpdatePlanterRequest request) {
        return planterService.rename(principal.getId(), planterId, request);
    }

    @DeleteMapping(ApiPaths.Planters.BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User principal, @PathVariable UUID planterId) {
        planterService.delete(principal.getId(), planterId);
    }
}
