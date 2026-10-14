package com.myplunt;

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
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Boots only the logging setup from application.yml (no beans, no database), so it
// checks the real config without Docker.
class ErrorLogFileTest {

    private static final Logger log = LoggerFactory.getLogger(ErrorLogFileTest.class);

    @Configuration
    static class NoBeans {
    }

    @Test
    void logFile_holdsWarningsAndErrorsAsJsonLinesButNotInfo(@TempDir Path dir) throws IOException {
        Path logFile = dir.resolve("errors.log");
        // Cached test contexts leave Logback marked as initialised, which would make the
        // new context skip applying its logging config.
        LoggingSystem.get(getClass().getClassLoader()).cleanUp();

        try (ConfigurableApplicationContext ignored = new SpringApplicationBuilder(NoBeans.class)
                .web(WebApplicationType.NONE)
                .run("--logging.file.name=" + logFile)) {
            log.info("plant watered");
            log.warn("photo could not be deleted");
            log.error("database unreachable", new RuntimeException("connection refused"));
        }

        List<String> lines = Files.readAllLines(logFile).stream()
                .filter(line -> line.contains(ErrorLogFileTest.class.getName()))
                .toList();
        assertThat(lines).hasSize(2);
        assertThat(lines).allSatisfy(line -> assertThat(line).startsWith("{").endsWith("}"));
        assertThat(lines.get(0)).contains("\"level\":\"WARN\"", "photo could not be deleted");
        assertThat(lines.get(1)).contains(
                "\"level\":\"ERROR\"",
                "database unreachable",
                "\"message\":\"connection refused\"",
                "\"stack_trace\"");
    }
}
