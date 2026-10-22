package com.myplunt.admin;

import com.myplunt.admin.dto.LogOverviewResponse;
import com.myplunt.admin.dto.LogPageResponse;
import com.myplunt.constants.ApiPaths;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminLogController {

    private final AdminLogService adminLogService;

    public AdminLogController(AdminLogService adminLogService) {
        this.adminLogService = adminLogService;
    }

    @GetMapping(ApiPaths.Admin.LOGS_OVERVIEW)
    public LogOverviewResponse overview(@RequestParam(defaultValue = "7") int days) {
        return adminLogService.overview(days);
    }

    @GetMapping(ApiPaths.Admin.LOGS)
    public LogPageResponse entries(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return adminLogService.entries(level, location, page, size);
    }
}
