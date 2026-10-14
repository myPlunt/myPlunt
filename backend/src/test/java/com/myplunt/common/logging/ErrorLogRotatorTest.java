package com.myplunt.common.logging;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.logging.DeferredLogs;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class ErrorLogRotatorTest {

    @TempDir
    Path dir;

    private final ErrorLogRotator rotator = new ErrorLogRotator(new DeferredLogs());

    @Test
    void rotate_renamesThePreviousRunsFileAfterTheTimeItWasLastWritten() throws IOException {
        Path logFile = dir.resolve("myplunt-errors.log");
        Files.writeString(logFile, "{\"message\":\"previous run\"}\n");
        Instant lastWritten = Instant.parse("2026-10-14T09:05:32Z");
        Files.setLastModifiedTime(logFile, FileTime.from(lastWritten));

        rotator.rotate(logFile, 14);

        String stamp = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")
                .withZone(ZoneId.systemDefault()).format(lastWritten);
        assertThat(logFile).doesNotExist();
        assertThat(dir.resolve("myplunt-errors-" + stamp + ".log")).hasContent("{\"message\":\"previous run\"}");
    }

    @Test
    void rotate_leavesAnEmptyFileInPlace() throws IOException {
        Path logFile = Files.createFile(dir.resolve("myplunt-errors.log"));

        rotator.rotate(logFile, 14);

        assertThat(fileNames()).containsExactly("myplunt-errors.log");
    }

    @Test
    void rotate_doesNothingOnFirstStartWhenTheFolderDoesNotExistYet() {
        Path logFile = dir.resolve("logs/myplunt-errors.log");

        rotator.rotate(logFile, 14);

        assertThat(dir.resolve("logs")).doesNotExist();
    }

    @Test
    void rotate_deletesArchivesOlderThanMaxHistoryButKeepsOtherFiles() throws IOException {
        Path logFile = dir.resolve("myplunt-errors.log");
        Path oldArchive = archiveAgedDays("myplunt-errors-2026-09-01_10-00-00.log", 20);
        Path recentArchive = archiveAgedDays("myplunt-errors-2026-10-10_10-00-00.log", 4);
        Path unrelated = archiveAgedDays("other-2026-09-01_10-00-00.log", 20);

        rotator.rotate(logFile, 14);

        assertThat(oldArchive).doesNotExist();
        assertThat(recentArchive).exists();
        assertThat(unrelated).exists();
    }

    private Path archiveAgedDays(String name, int days) throws IOException {
        Path file = Files.writeString(dir.resolve(name), "{}\n");
        Files.setLastModifiedTime(file, FileTime.from(Instant.now().minus(Duration.ofDays(days))));
        return file;
    }

    private List<String> fileNames() throws IOException {
        try (Stream<Path> files = Files.list(dir)) {
            return files.map(path -> path.getFileName().toString()).toList();
        }
    }
}
