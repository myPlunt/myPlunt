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
import java.util.stream.Stream;

/**
 * Gives every start of the backend its own error log: before logging starts, the previous
 * run's file is renamed to {@code <name>-<yyyy-MM-dd_HH-mm-ss>.log} (the time it was last
 * written), so each archived file is complete and safe to import. Archives older than
 * {@code logging.logback.rollingpolicy.max-history} days are deleted.
 *
 * <p>Runs as an EnvironmentPostProcessor because that is the last hook before Spring Boot
 * opens the log file, and after application.yml has been read.
 */
public class ErrorLogRotator implements EnvironmentPostProcessor {

    private static final DateTimeFormatter ARCHIVE_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss").withZone(ZoneId.systemDefault());

    // Logging isn't set up yet at this point; a deferred log is replayed once it is.
    private final Log log;

    public ErrorLogRotator(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(ErrorLogRotator.class);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String fileName = environment.getProperty("logging.file.name");
        if (fileName == null) {
            return;
        }
        int maxHistoryDays = environment.getProperty("logging.logback.rollingpolicy.max-history", Integer.class, 7);
        rotate(Path.of(fileName), maxHistoryDays);
    }

    void rotate(Path logFile, int maxHistoryDays) {
        String baseName = logFile.getFileName().toString().replaceFirst("\\.log$", "");
        try {
            if (Files.exists(logFile) && Files.size(logFile) > 0) {
                Instant lastWritten = Files.getLastModifiedTime(logFile).toInstant();
                Path archive = logFile.resolveSibling(baseName + "-" + ARCHIVE_TIME.format(lastWritten) + ".log");
                Files.move(logFile, archive);
            }
            deleteOldArchives(logFile, baseName, maxHistoryDays);
        } catch (IOException e) {
            // Never block startup over this; logback just keeps appending to the old file.
            log.warn("Could not rotate the error log " + logFile, e);
        }
    }

    private void deleteOldArchives(Path logFile, String baseName, int maxHistoryDays) throws IOException {
        Path dir = logFile.toAbsolutePath().getParent();
        if (!Files.isDirectory(dir)) {
            return; // first start: logback creates the folder later
        }
        Instant cutoff = Instant.now().minusSeconds(maxHistoryDays * 86_400L);
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
