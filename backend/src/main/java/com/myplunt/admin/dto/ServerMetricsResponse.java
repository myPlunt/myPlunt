package com.myplunt.admin.dto;

import java.time.Instant;
import java.util.List;

// The dashboard's Overview: Uptime Kuma's monitors, Glances' host numbers and the alerts worked out
// from them and the logs. monitors / host are null when that source isn't set up or didn't answer
// (the latter also raises an alert).
public record ServerMetricsResponse(List<Monitor> monitors, Host host, List<Alert> alerts) {

    // status: up, down, pending or maintenance (Kuma's). uptime24h is a percentage.
    public record Monitor(String name, String status, Double uptime24h, Integer pingMs, Instant lastCheck,
                          List<Beat> beats) {}

    public record Beat(Instant time, String status, Integer pingMs) {}

    public record Host(double cpuPercent, Usage memory, Usage swap, Usage disk,
                       double load1, double load5, double load15, int cpuCores, String uptime) {}

    public record Usage(double percent, long usedBytes, long totalBytes) {}

    // severity: critical or warning. since is null when the source can't tell.
    public record Alert(String severity, String title, String detail, String source, Instant since) {}
}
