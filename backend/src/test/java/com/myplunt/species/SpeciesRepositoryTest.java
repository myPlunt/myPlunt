package com.myplunt.species;

import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.util.ReflectionTestUtils;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Runs the discovered-species SQL against the real Flyway schema; a mock can't check "on conflict".
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class SpeciesRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private SpeciesRepository speciesRepository;

    private Species species(String commonName, String scientificName) {
        Species species = new Species(commonName, 7);
        ReflectionTestUtils.setField(species, "scientificName", scientificName);
        return speciesRepository.save(species);
    }

    @Test
    void markDiscovered_keepsTheSpeciesDiscoveredOnceAndAfterThePlantIsDeleted() {
        User jane = userRepository.save(new User("jane", "jane@example.com", "hashed"));
        User john = userRepository.save(new User("john", "john@example.com", "hashed"));
        Species monstera = species("Monstera", "Monstera deliciosa");
        Plant vera = new Plant(jane.getId(), "Vera");
        vera.setSpecies(monstera);
        plantRepository.save(vera);

        speciesRepository.markDiscovered(jane.getId(), monstera.getId());
        speciesRepository.markDiscovered(jane.getId(), monstera.getId());
        plantRepository.delete(vera);
        plantRepository.flush();

        List<SpeciesRepository.DiscoveredSpecies> discovered = speciesRepository.findDiscoveredSpecies(jane.getId());
        assertThat(discovered).hasSize(1);
        assertThat(discovered.get(0).getSpeciesId()).isEqualTo(monstera.getId());
        assertThat(discovered.get(0).getDiscoveredAt()).isNotNull();
        assertThat(speciesRepository.findDiscoveredSpecies(john.getId())).isEmpty();
    }
}
