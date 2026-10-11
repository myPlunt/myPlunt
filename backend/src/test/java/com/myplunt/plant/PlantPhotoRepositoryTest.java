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

// Runs the newest-photo query against the real Flyway schema; a mock can't check the JPQL.
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PlantPhotoRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private PlantPhotoRepository plantPhotoRepository;

    @Test
    void findLatestPhotos_returnsTheNewestPhotoPerRequestedPlant() {
        User jane = userRepository.save(new User("jane", "jane@example.com", "hashed"));
        Plant george = plantRepository.save(new Plant(jane.getId(), "George"));
        Plant pinky = plantRepository.save(new Plant(jane.getId(), "Pinky"));
        Plant noPhoto = plantRepository.save(new Plant(jane.getId(), "Monty"));
        Plant notRequested = plantRepository.save(new Plant(jane.getId(), "Basil"));
        Instant earlier = Instant.parse("2026-10-01T08:00:00Z");
        Instant latest = Instant.parse("2026-10-05T08:00:00Z");
        plantPhotoRepository.saveAll(List.of(
                new PlantPhoto(george, jane.getId(), "plants/george-old.jpg", earlier),
                new PlantPhoto(george, jane.getId(), "plants/george-new.jpg", latest),
                new PlantPhoto(pinky, jane.getId(), "plants/pinky.jpg", earlier),
                new PlantPhoto(notRequested, jane.getId(), "plants/basil.jpg", latest)));

        List<LatestPhoto> result = plantPhotoRepository.findLatestPhotos(
                List.of(george.getId(), pinky.getId(), noPhoto.getId()));

        assertThat(result).containsExactlyInAnyOrder(
                new LatestPhoto(george.getId(), "plants/george-new.jpg"),
                new LatestPhoto(pinky.getId(), "plants/pinky.jpg"));
    }
}
