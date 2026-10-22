package com.myplunt.plant;

import com.myplunt.plant.dto.WateringLogResponse;
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

    @Test
    void findOwnersWaterings_returnsTheOwnersWateringsInTheRangeNewestFirst() {
        User jane = userRepository.save(new User("jane", "jane@example.com", "hashed"));
        User john = userRepository.save(new User("john", "john@example.com", "hashed"));
        Plant george = plantRepository.save(new Plant(jane.getId(), "George"));
        Plant passedAway = new Plant(jane.getId(), "Ivy");
        passedAway.setAlive(false);
        plantRepository.save(passedAway);
        Plant johns = plantRepository.save(new Plant(john.getId(), "Basil"));
        Instant from = Instant.parse("2026-10-01T00:00:00Z");
        Instant to = Instant.parse("2026-11-01T00:00:00Z");
        WateringLog first = new WateringLog(george, jane.getId(), from);
        WateringLog ivys = new WateringLog(passedAway, jane.getId(), Instant.parse("2026-10-05T08:00:00Z"));
        WateringLog latest = new WateringLog(george, jane.getId(), Instant.parse("2026-10-20T08:00:00Z"));
        wateringLogRepository.saveAll(List.of(
                first,
                ivys,
                latest,
                // Outside the range: just before from, and exactly at the exclusive to.
                new WateringLog(george, jane.getId(), from.minusSeconds(1)),
                new WateringLog(george, jane.getId(), to),
                // Someone else's plant.
                new WateringLog(johns, john.getId(), Instant.parse("2026-10-10T08:00:00Z"))));

        List<WateringLogResponse> result = wateringLogRepository.findOwnersWaterings(jane.getId(), from, to);

        assertThat(result).containsExactly(
                new WateringLogResponse(latest.getId(), george.getId(), "George", latest.getWateredAt()),
                new WateringLogResponse(ivys.getId(), passedAway.getId(), "Ivy", ivys.getWateredAt()),
                new WateringLogResponse(first.getId(), george.getId(), "George", first.getWateredAt()));
    }
}
