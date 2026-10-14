package com.myplunt.common.logging;

import org.apache.commons.logging.Log;
import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.env.ConfigurableEnvironment;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Stream;

/**
 * Gives every start of the backend fresh log files: before logging starts, each of the previous
 * run's files (backend.log, audit.log, frontend.log in {@code app.logging.dir}) is renamed to
 * {@code <name>-<yyyy-MM-dd_HH-mm-ss>.log} (the time it was last written), so each archived file
 * is complete and safe to import. Archives older than that file's
 * {@code app.logging.retention-days} are deleted.
 *
 * <p>Runs as an EnvironmentPostProcessor because that is the last hook before Spring Boot
 * opens the log files, and after application.yml has been read.
 */
public class LogFileRotator implements EnvironmentPostProcessor {

    private static final int DEFAULT_RETENTION_DAYS = 14;
    private static final DateTimeFormatter ARCHIVE_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss").withZone(ZoneId.systemDefault());

    // Logging isn't set up yet at this point; a deferred log is replayed once it is.
    private final Log log;

    public LogFileRotator(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(LogFileRotator.class);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path dir = Path.of(environment.getProperty("app.logging.dir", "logs"));
        for (String channel : List.of("backend", "audit", "frontend")) {
            int retentionDays = environment.getProperty(
                    "app.logging.retention-days." + channel, Integer.class, DEFAULT_RETENTION_DAYS);
            rotate(dir.resolve(channel + ".log"), retentionDays);
        }
    }

    void rotate(Path logFile, int retentionDays) {
        String baseName = logFile.getFileName().toString().replaceFirst("\\.log$", "");
        try {
            if (Files.exists(logFile) && Files.size(logFile) > 0) {
                Instant lastWritten = Files.getLastModifiedTime(logFile).toInstant();
                Path archive = logFile.resolveSibling(baseName + "-" + ARCHIVE_TIME.format(lastWritten) + ".log");
                Files.move(logFile, archive);
            }
            deleteOldArchives(logFile, baseName, retentionDays);
        } catch (IOException e) {
            // Never block startup over this; logback just keeps appending to the old file.
            log.warn("Could not rotate the log file " + logFile, e);
        }
    }

    private void deleteOldArchives(Path logFile, String baseName, int retentionDays) throws IOException {
        Path dir = logFile.toAbsolutePath().getParent();
        if (!Files.isDirectory(dir)) {
            return; // first start: logback creates the folder later
        }
        Instant cutoff = Instant.now().minusSeconds(retentionDays * 86_400L);
        try (Stream<Path> files = Files.list(dir)) {
            for (Path file : files.toList()) {
                String name = file.getFileName().toString();
                if (name.startsWith(baseName + "-") && name.endsWith(".log")
                        && Files.getLastModifiedTime(file).toInstant().isBefore(cutoff)) {
                    Files.delete(file);
                }
            }
        }
    }
}
