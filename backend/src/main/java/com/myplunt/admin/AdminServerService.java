package com.myplunt.admin;

import com.myplunt.admin.AdminLogService.ErrorRate;
import com.myplunt.admin.dto.ServerMetricsResponse;
import com.myplunt.admin.dto.ServerMetricsResponse.Alert;
import com.myplunt.admin.dto.ServerMetricsResponse.Beat;
import com.myplunt.admin.dto.ServerMetricsResponse.Host;
import com.myplunt.admin.dto.ServerMetricsResponse.Monitor;
import com.myplunt.admin.dto.ServerMetricsResponse.Usage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

// The Overview's server health. Uptime Kuma (its public status page API, so no API key) says
// whether the backend and database answer; Glances (its REST API, run with -w) gives the host's
// CPU, memory and disk. Both are on the same Coolify Docker network as the backend. Alerts are
// worked out on every call, nothing is stored. Like the rest of the admin app nothing here is
// logged: a source that doesn't answer becomes an alert instead.
// ponytail: no caching, every dashboard poll asks Kuma and Glances again; add a short cache if
// many admins keep the Overview open.
@Service
public class AdminServerService {

    static final double DISK_ALERT_PERCENT = 85;
    static final double MEMORY_ALERT_PERCENT = 90;
    // An hour with at least this many errors, and this many times the usual, is a spike.
    static final long ERROR_SPIKE_MIN = 10;
    static final double ERROR_SPIKE_FACTOR = 3;
    private static final int BEATS = 50;
    private static final Duration TIMEOUT = Duration.ofSeconds(2);
    private static final double GB = 1024.0 * 1024 * 1024;
    // Kuma's heartbeat status codes, by index.
    private static final List<String> KUMA_STATUSES = List.of("down", "up", "pending", "maintenance");

    private final RestClient http;
    private final String kumaUrl;
    private final String kumaStatusPage;
    private final String glancesUrl;
    private final AdminLogService adminLogService;

    public AdminServerService(
            @Value("${app.monitoring.kuma-url}") String kumaUrl,
            @Value("${app.monitoring.kuma-status-page}") String kumaStatusPage,
            @Value("${app.monitoring.glances-url}") String glancesUrl,
            AdminLogService adminLogService) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(TIMEOUT);
        requestFactory.setReadTimeout(TIMEOUT);
        this.http = RestClient.builder().requestFactory(requestFactory).build();
        this.kumaUrl = stripSlash(kumaUrl);
        this.kumaStatusPage = kumaStatusPage;
        this.glancesUrl = stripSlash(glancesUrl);
        this.adminLogService = adminLogService;
    }

    public ServerMetricsResponse metrics() {
        List<Alert> alerts = new ArrayList<>();

        List<Monitor> monitors = null;
        if (!kumaUrl.isBlank() && !kumaStatusPage.isBlank()) {
            try {
                monitors = monitors(alerts);
            } catch (RuntimeException e) {
                alerts.add(notAnswering("Uptime Kuma"));
            }
        }

        Host host = null;
        if (!glancesUrl.isBlank()) {
            try {
                host = host();
            } catch (RuntimeException e) {
                alerts.add(notAnswering("Glances"));
            }
        }
        if (host != null) {
            if (host.disk().percent() >= DISK_ALERT_PERCENT) {
                alerts.add(warning("Disk almost full", usage(host.disk())
                        + " Uploads and the database stop working when it's full.", "Glances"));
            }
            if (host.memory().percent() >= MEMORY_ALERT_PERCENT) {
                alerts.add(warning("Memory almost full", usage(host.memory()), "Glances"));
            }
        }

        ErrorRate errors = adminLogService.errorRate();
        if (errors.lastHour() >= ERROR_SPIKE_MIN && errors.lastHour() >= ERROR_SPIKE_FACTOR * errors.usualPerHour()) {
            String usual = errors.usualPerHour() < 1 ? "usually almost none" : "usually about " + Math.round(errors.usualPerHour());
            alerts.add(warning("Error spike", errors.lastHour() + " errors in the last hour, " + usual + ".", "Logs"));
        }

        alerts.sort(Comparator.comparing(alert -> !alert.severity().equals("critical")));
        return new ServerMetricsResponse(monitors, host, alerts);
    }

    // Every monitor on the status page, in its order. A monitor whose last check failed raises a
    // critical alert, dated from the first failure in a row.
    private List<Monitor> monitors(List<Alert> alerts) {
        JsonNode page = get(kumaUrl + "/api/status-page/{slug}", kumaStatusPage);
        JsonNode heartbeats = get(kumaUrl + "/api/status-page/heartbeat/{slug}", kumaStatusPage);

        List<Monitor> monitors = new ArrayList<>();
        for (JsonNode group : page.path("publicGroupList")) {
            for (JsonNode monitor : group.path("monitorList")) {
                String id = String.valueOf(monitor.path("id").asLong());
                String name = monitor.path("name").asString();
                List<JsonNode> beats = new ArrayList<>(heartbeats.path("heartbeatList").path(id).values());
                beats.sort(Comparator.comparing(beat -> kumaTime(beat.path("time").asString())));
                List<JsonNode> recent = beats.subList(Math.max(0, beats.size() - BEATS), beats.size());

                JsonNode last = recent.isEmpty() ? null : recent.getLast();
                JsonNode uptime = heartbeats.path("uptimeList").path(id + "_24");
                monitors.add(new Monitor(name,
                        last == null ? "pending" : status(last),
                        uptime.isNumber() ? uptime.asDouble() * 100 : null,
                        last == null ? null : ping(last),
                        last == null ? null : kumaTime(last.path("time").asString()),
                        recent.stream().map(beat -> new Beat(kumaTime(beat.path("time").asString()), status(beat), ping(beat))).toList()));

                if (last != null && status(last).equals("down")) {
                    int failed = 0;
                    while (failed < beats.size() && status(beats.get(beats.size() - 1 - failed)).equals("down")) failed++;
                    JsonNode firstFailure = beats.get(beats.size() - failed);
                    String message = last.path("msg").asString("");
                    alerts.add(new Alert("critical", name + " not responding",
                            failed + (failed == 1 ? " failed check." : " failed checks in a row.")
                                    + (message.isBlank() ? "" : " " + message),
                            "Uptime Kuma", kumaTime(firstFailure.path("time").asString())));
                }
            }
        }
        return monitors;
    }

    // The disk is the largest filesystem Glances sees: in a container it also lists small mounts.
    private Host host() {
        JsonNode cpu = get(glancesUrl + "/api/4/quicklook");
        JsonNode memory = get(glancesUrl + "/api/4/mem");
        JsonNode swap = get(glancesUrl + "/api/4/memswap");
        JsonNode load = get(glancesUrl + "/api/4/load");
        JsonNode disk = get(glancesUrl + "/api/4/fs").values().stream()
                .max(Comparator.comparingLong(fs -> fs.path("size").asLong()))
                .orElseThrow();
        return new Host(cpu.path("cpu").asDouble(), usageOf(memory), usageOf(swap),
                new Usage(disk.path("percent").asDouble(), disk.path("used").asLong(), disk.path("size").asLong()),
                load.path("min1").asDouble(), load.path("min5").asDouble(), load.path("min15").asDouble(),
                load.path("cpucore").asInt(), get(glancesUrl + "/api/4/uptime").asString());
    }

    private JsonNode get(String url, Object... variables) {
        return http.get().uri(url, variables).retrieve().body(JsonNode.class);
    }

    private static Usage usageOf(JsonNode node) {
        return new Usage(node.path("percent").asDouble(), node.path("used").asLong(), node.path("total").asLong());
    }

    private static String status(JsonNode beat) {
        int code = beat.path("status").asInt();
        return code >= 0 && code < KUMA_STATUSES.size() ? KUMA_STATUSES.get(code) : "pending";
    }

    private static Integer ping(JsonNode beat) {
        JsonNode ping = beat.path("ping");
        return ping.isNumber() ? (int) Math.round(ping.asDouble()) : null;
    }

    // Kuma sends UTC times as "2026-10-21 14:02:00.123".
    static Instant kumaTime(String text) {
        String iso = text.replace(' ', 'T');
        return iso.endsWith("Z") ? Instant.parse(iso) : LocalDateTime.parse(iso).toInstant(ZoneOffset.UTC);
    }

    private static String usage(Usage usage) {
        return "%.0f%% used, %.1f of %.1f GB.".formatted(usage.percent(), usage.usedBytes() / GB, usage.totalBytes() / GB);
    }

    private static Alert notAnswering(String source) {
        return warning(source + " isn't answering", "Its numbers are missing until it's back.", source);
    }

    private static Alert warning(String title, String detail, String source) {
        return new Alert("warning", title, detail, source, null);
    }

    private static String stripSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
