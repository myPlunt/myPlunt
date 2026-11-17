package com.myplunt.plant;

import com.myplunt.garden.Planter;
import com.myplunt.garden.PlanterRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class PlantRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlanterRepository planterRepository;

    @Autowired
    private PlantRepository plantRepository;

    // Indoor, unassigned and dead plants don't count; only a living plant in an outdoor planter does.
    @Test
    void hasLivingOutdoorPlants_countsOnlyLivingPlantsInAnOutdoorPlanter() {
        User jane = userRepository.save(new User("jane", "jane@example.com", "hashed"));
        Planter kitchen = planterRepository.save(new Planter(jane.getId(), "Kitchen", false));
        Planter balcony = planterRepository.save(new Planter(jane.getId(), "Balcony", true));
        Plant inKitchen = new Plant(jane.getId(), "George");
        inKitchen.setPlanterId(kitchen.getId());
        plantRepository.save(inKitchen);
        plantRepository.save(new Plant(jane.getId(), "Monty"));
        Plant dead = new Plant(jane.getId(), "Basil");
        dead.setPlanterId(balcony.getId());
        dead.setAlive(false);
        plantRepository.save(dead);

        assertThat(plantRepository.hasLivingOutdoorPlants(jane.getId())).isFalse();

        Plant onBalcony = new Plant(jane.getId(), "Pinky");
        onBalcony.setPlanterId(balcony.getId());
        plantRepository.save(onBalcony);

        assertThat(plantRepository.hasLivingOutdoorPlants(jane.getId())).isTrue();
    }
}
