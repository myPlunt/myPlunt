package com.myplunt.admin.dto;

import java.util.List;

public record LogPageResponse(List<LogEntryResponse> entries, long total, int page, int size) {}
