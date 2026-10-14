package com.myplunt;

import com.myplunt.common.logging.ActionLog;
import com.myplunt.common.logging.UserAction;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.logging.LoggingSystem;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

// Boots only the logging setup from application.yml and logback-spring.xml (no beans, no
// database), so it checks the real config without Docker.
class LogFileTest {

    private static final Logger ours = LoggerFactory.getLogger(LogFileTest.class);
    private static final Logger library = LoggerFactory.getLogger("org.example.SomeLibrary");

    @Configuration
    static class NoBeans {
    }

    @Test
    void logFile_holdsWarningsErrorsAndOurInfoLinesAsJsonButNotLibraryInfo(@TempDir Path dir) throws IOException {
        List<String> lines = logToFile(dir, () -> {
            library.info("library started");
            library.warn("library warning");
            ours.info("plant watered");
            ours.warn("photo could not be deleted");
            ours.error("database unreachable", new RuntimeException("connection refused"));
        });

        assertThat(lines).hasSize(4);
        assertThat(lines).allSatisfy(line -> assertThat(line).startsWith("{").endsWith("}"));
        assertThat(lines.get(0)).contains("\"level\":\"WARN\"", "library warning");
        assertThat(lines.get(1)).contains("\"level\":\"INFO\"", "plant watered");
        assertThat(lines.get(2)).contains("\"level\":\"WARN\"", "photo could not be deleted");
        assertThat(lines.get(3)).contains(
                "\"level\":\"ERROR\"",
                "database unreachable",
                "\"error\":{\"type\":\"java.lang.RuntimeException\",\"message\":\"connection refused\"",
                "\"stackTrace\"");
    }

    @Test
    void actionLog_writesOneFlatJsonLineWithTheActionAndItsIds(@TempDir Path dir) throws IOException {
        UUID userId = UUID.randomUUID();
        UUID plantId = UUID.randomUUID();

        List<String> lines = logToFile(dir, () -> new ActionLog()
                .record(UserAction.WATERING_STREAK_BROKEN, userId, plantId, Map.of("lostStreak", 4)));

        assertThat(lines).singleElement().asString()
                .startsWith("{\"timestamp\":\"")
                .endsWith("\"level\":\"INFO\",\"service\":\"backend\",\"message\":\"WATERING_STREAK_BROKEN\","
                        + "\"action\":\"WATERING_STREAK_BROKEN\",\"userId\":\"" + userId + "\","
                        + "\"plantId\":\"" + plantId + "\",\"lostStreak\":4}");
    }

    // The lines written while the logging config from application.yml is active, minus the
    // ones Spring writes while starting up.
    private static List<String> logToFile(Path dir, Runnable logging) throws IOException {
        Path logFile = dir.resolve("myplunt.log");
        // Cached test contexts leave Logback marked as initialised, which would make the
        // new context skip applying its logging config.
        LoggingSystem.get(LogFileTest.class.getClassLoader()).cleanUp();

        long startupLength;
        try (ConfigurableApplicationContext ignored = new SpringApplicationBuilder(NoBeans.class)
                .web(WebApplicationType.NONE)
                .run("--logging.file.name=" + logFile)) {
            startupLength = Files.size(logFile);
            logging.run();
        }

        byte[] written = Files.readAllBytes(logFile);
        return new String(written, (int) startupLength, written.length - (int) startupLength, StandardCharsets.UTF_8)
                .lines()
                .toList();
    }
}
