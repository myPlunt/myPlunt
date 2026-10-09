package com.myplunt.plant;

import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Runs the aggregate query against the real Flyway schema; a mock can't check the JPQL.
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class WateringLogRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private WateringLogRepository wateringLogRepository;

    @Test
    void findLastWateredAt_returnsTheLatestWateringPerRequestedPlant() {
        User jane = userRepository.save(new User("jane", "jane@example.com", "hashed"));
        Plant george = plantRepository.save(new Plant(jane.getId(), "George"));
        Plant pinky = plantRepository.save(new Plant(jane.getId(), "Pinky"));
        Plant neverWatered = plantRepository.save(new Plant(jane.getId(), "Monty"));
        Plant notRequested = plantRepository.save(new Plant(jane.getId(), "Basil"));
        Instant earlier = Instant.parse("2026-10-01T08:00:00Z");
        Instant latest = Instant.parse("2026-10-05T08:00:00Z");
        wateringLogRepository.saveAll(List.of(
                new WateringLog(george, jane.getId(), earlier),
                new WateringLog(george, jane.getId(), latest),
                new WateringLog(pinky, jane.getId(), earlier),
                new WateringLog(notRequested, jane.getId(), latest)));

        List<LastWatering> result = wateringLogRepository.findLastWateredAt(
                List.of(george.getId(), pinky.getId(), neverWatered.getId()));

        assertThat(result).containsExactlyInAnyOrder(
                new LastWatering(george.getId(), latest),
                new LastWatering(pinky.getId(), earlier));
    }
}
