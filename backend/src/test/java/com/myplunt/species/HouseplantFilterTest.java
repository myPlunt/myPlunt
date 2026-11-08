package com.myplunt.species;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class HouseplantFilterTest {

    private static JsonNode json(String text) {
        return JsonMapper.builder().build().readTree(text);
    }

    @Test
    void isHouseplant_keepsIndoorPlantsAndDropsOutdoorOnes() {
        assertThat(HouseplantFilter.isHouseplant("Monstera deliciosa")).isTrue();
        assertThat(HouseplantFilter.isHouseplant(" ficus  lyrata ")).isTrue();
        assertThat(HouseplantFilter.isHouseplant("Asplenium nidus")).isTrue();
        // Same genus as an indoor species, but wild or a big tree.
        assertThat(HouseplantFilter.isHouseplant("Asplenium trichomanes")).isFalse();
        assertThat(HouseplantFilter.isHouseplant("Ficus religiosa")).isFalse();
        // The wild plants the import used to bring in.
        assertThat(HouseplantFilter.isHouseplant("Urtica dioica")).isFalse();
        assertThat(HouseplantFilter.isHouseplant("Mentha aquatica")).isFalse();
        assertThat(HouseplantFilter.isHouseplant("Sedum acre")).isFalse();
        assertThat(HouseplantFilter.isHouseplant("Quercus robur")).isFalse();
    }

    @Test
    void isTree_byTypeHabitOrHeight() {
        assertThat(HouseplantFilter.isTree(json("{\"specifications\": {\"ligneous_type\": \"tree\"}}"))).isTrue();
        assertThat(HouseplantFilter.isTree(json("{\"specifications\": {\"growth_habit\": \"Tree, Shrub\"}}"))).isTrue();
        assertThat(HouseplantFilter.isTree(json("{\"specifications\": {\"maximum_height\": {\"cm\": 2500}}}"))).isTrue();
        // Monstera and lavender's real Trefle specifications.
        assertThat(HouseplantFilter.isTree(json("{\"specifications\": {\"growth_habit\": \"Vine, Forb/herb\", \"maximum_height\": {\"cm\": null}}}")))
                .isFalse();
        assertThat(HouseplantFilter.isTree(json("{\"specifications\": {\"average_height\": {\"cm\": 100}}}"))).isFalse();
    }
}
