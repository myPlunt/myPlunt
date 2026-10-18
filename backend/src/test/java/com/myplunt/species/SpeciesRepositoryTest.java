package com.myplunt.species;

import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Runs the discovered-species SQL and the pending-species query against the real Flyway schema; a
// mock can't check "on conflict" or the database-set submission time.
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

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TestEntityManager entityManager;

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

    @Test
    void findPendingWithSubmitter_returnsOnlyUnapprovedSpeciesOldestFirstWithTheirSubmitter() {
        User jane = userRepository.save(new User("jane", "jane@example.com", "hashed"));
        Species olive = species("Olive tree", "Olea europaea");
        Species sage = species("Common sage", "Salvia officinalis");
        Species approved = species("Monstera", "Monstera deliciosa");
        ReflectionTestUtils.setField(olive, "submittedBy", jane);
        ReflectionTestUtils.setField(approved, "approved", true);
        entityManager.flush();
        // Everything saved in one transaction shares now(), so the submission times are set apart here.
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        jdbc.update("update species set updated_at = ? where id = ?", Timestamp.from(now.minus(1, ChronoUnit.DAYS)), sage.getId());
        jdbc.update("update species set updated_at = ? where id = ?", Timestamp.from(now.minus(3, ChronoUnit.DAYS)), olive.getId());
        entityManager.clear();

        List<Species> pending = speciesRepository.findPendingWithSubmitter();

        assertThat(pending).extracting(Species::getCommonName).containsExactly("Olive tree", "Common sage");
        assertThat(pending.get(0).getSubmittedBy().getUsername()).isEqualTo("jane");
        assertThat(pending.get(0).getUpdatedAt()).isEqualTo(now.minus(3, ChronoUnit.DAYS));
        assertThat(pending.get(1).getSubmittedBy()).isNull();
    }
}
