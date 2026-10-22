package com.myplunt.admin;

import com.myplunt.admin.AdminLogService.ErrorRate;
import com.myplunt.admin.dto.ServerMetricsResponse;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminServerServiceTest {

    private static final Map<String, String> RESPONSES = Map.of(
            "/api/status-page/main", """
                    {"publicGroupList": [{"name": "Services", "monitorList": [
                        {"id": 1, "name": "Backend"}, {"id": 2, "name": "Database"}]}]}""",
            "/api/status-page/heartbeat/main", """
                    {"heartbeatList": {
                        "1": [{"status": 1, "time": "2026-10-21 14:00:00.000", "ping": 40, "msg": ""},
                              {"status": 1, "time": "2026-10-21 14:01:00.000", "ping": 42, "msg": ""}],
                        "2": [{"status": 0, "time": "2026-10-21 14:02:00.000", "ping": null, "msg": "connect ECONNREFUSED"},
                              {"status": 1, "time": "2026-10-21 14:00:00.000", "ping": 3, "msg": ""},
                              {"status": 0, "time": "2026-10-21 14:01:00.000", "ping": null, "msg": "connect ECONNREFUSED"}]},
                     "uptimeList": {"1_24": 0.9998, "2_24": 0.972}}""",
            "/api/4/quicklook", "{\"cpu\": 23.4, \"mem\": 61.0, \"swap\": 4.0}",
            "/api/4/mem", "{\"percent\": 61.0, \"used\": 5261334937, \"total\": 8589934592}",
            "/api/4/memswap", "{\"percent\": 4.0, \"used\": 85899345, \"total\": 2147483648}",
            "/api/4/load", "{\"min1\": 0.42, \"min5\": 0.51, \"min15\": 0.48, \"cpucore\": 4}",
            "/api/4/fs", """
                    [{"mnt_point": "/etc/hosts", "size": 1000, "used": 10, "percent": 1.0},
                     {"mnt_point": "/", "size": 85899345920, "used": 74732430950, "percent": 87.0}]""",
            "/api/4/uptime", "\"12 days, 4:31:02\"");

    private final AdminLogService adminLogService = mock(AdminLogService.class);
    private HttpServer server;
    private String url;

    @BeforeEach
    void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            String body = RESPONSES.get(exchange.getRequestURI().getPath());
            byte[] bytes = (body == null ? "" : body).getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(body == null ? 404 : 200, bytes.length == 0 ? -1 : bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        url = "http://127.0.0.1:" + server.getAddress().getPort();
        when(adminLogService.errorRate()).thenReturn(new ErrorRate(1, 2));
    }

    @AfterEach
    void stop() {
        server.stop(0);
    }

    @Test
    void metrics_mapsKumaAndGlancesAndRaisesAlerts() {
        when(adminLogService.errorRate()).thenReturn(new ErrorRate(24, 2));

        ServerMetricsResponse metrics = new AdminServerService(url, "main", url + "/", adminLogService).metrics();

        assertThat(metrics.monitors()).extracting("name", "status", "pingMs")
                .containsExactly(tuple("Backend", "up", 42), tuple("Database", "down", null));
        assertThat(metrics.monitors().getFirst().uptime24h()).isCloseTo(99.98, within(0.001));
        // Beats come oldest first, whatever order Kuma sends them in.
        assertThat(metrics.monitors().get(1).beats()).extracting("status").containsExactly("up", "down", "down");

        assertThat(metrics.host().cpuPercent()).isEqualTo(23.4);
        assertThat(metrics.host().disk().percent()).isEqualTo(87.0);
        assertThat(metrics.host().cpuCores()).isEqualTo(4);
        assertThat(metrics.host().uptime()).isEqualTo("12 days, 4:31:02");

        assertThat(metrics.alerts()).extracting("severity", "title")
                .containsExactly(tuple("critical", "Database not responding"),
                        tuple("warning", "Disk almost full"),
                        tuple("warning", "Error spike"));
        assertThat(metrics.alerts().getFirst().detail()).isEqualTo("2 failed checks in a row. connect ECONNREFUSED");
        assertThat(metrics.alerts().getFirst().since()).isEqualTo(Instant.parse("2026-10-21T14:01:00Z"));
        assertThat(metrics.alerts().getLast().detail()).isEqualTo("24 errors in the last hour, usually about 2.");
    }

    @Test
    void metrics_withNothingSetUp_isEmptyWithoutAlerts() {
        ServerMetricsResponse metrics = new AdminServerService("", "", "", adminLogService).metrics();

        assertThat(metrics.monitors()).isNull();
        assertThat(metrics.host()).isNull();
        assertThat(metrics.alerts()).isEmpty();
    }

    @Test
    void metrics_whenASourceDoesNotAnswer_alertsAndKeepsTheOther() {
        ServerMetricsResponse metrics = new AdminServerService(url, "missing", url, adminLogService).metrics();

        assertThat(metrics.monitors()).isNull();
        assertThat(metrics.host()).isNotNull();
        assertThat(metrics.alerts()).extracting("title")
                .containsExactly("Uptime Kuma isn't answering", "Disk almost full");
    }
}
