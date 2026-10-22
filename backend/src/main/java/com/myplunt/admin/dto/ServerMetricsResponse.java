package com.myplunt.admin.dto;

import java.time.Instant;
import java.util.List;

public record ServerMetricsResponse(List<Monitor> monitors, Host host, List<Alert> alerts) {

    public record Monitor(String name, String status, Double uptime24h, Integer pingMs, Instant lastCheck,
                          List<Beat> beats) {}

    public record Beat(Instant time, String status, Integer pingMs) {}

    public record Host(double cpuPercent, Usage memory, Usage swap, Usage disk,
                       double load1, double load5, double load15, int cpuCores, String uptime) {}

    public record Usage(double percent, long usedBytes, long totalBytes) {}

    public record Alert(String severity, String title, String detail, String source, Instant since) {}
}
