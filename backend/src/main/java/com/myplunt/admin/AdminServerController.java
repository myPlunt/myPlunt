package com.myplunt.admin;

import com.myplunt.admin.dto.ServerMetricsResponse;
import com.myplunt.constants.ApiPaths;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminServerController {

    private final AdminServerService adminServerService;

    public AdminServerController(AdminServerService adminServerService) {
        this.adminServerService = adminServerService;
    }

    @GetMapping(ApiPaths.Admin.SERVER)
    public ServerMetricsResponse metrics() {
        return adminServerService.metrics();
    }
}
