package com.myplunt.species;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

class TreeFilterTest {

    private static JsonNode json(String text) {
        return JsonMapper.builder().build().readTree(text);
    }

    @Test
    void isTreeGenus_skipsBigTreesButNotPottedOnes() {
        assertThat(TreeFilter.isTreeGenus("Quercus")).isTrue();
        assertThat(TreeFilter.isTreeGenus("Acer")).isTrue();
        assertThat(TreeFilter.isTreeGenus("Ficus")).isFalse();
        assertThat(TreeFilter.isTreeGenus(null)).isFalse();
    }

    @Test
    void isTree_byTypeHabitOrHeight() {
        assertThat(TreeFilter.isTree(json("{\"specifications\": {\"ligneous_type\": \"tree\"}}"))).isTrue();
        assertThat(TreeFilter.isTree(json("{\"specifications\": {\"growth_habit\": \"Tree, Shrub\"}}"))).isTrue();
        assertThat(TreeFilter.isTree(json("{\"specifications\": {\"maximum_height\": {\"cm\": 2500}}}"))).isTrue();
        // Monstera and lavender's real Trefle specifications.
        assertThat(TreeFilter.isTree(json("{\"specifications\": {\"growth_habit\": \"Vine, Forb/herb\", \"maximum_height\": {\"cm\": null}}}")))
                .isFalse();
        assertThat(TreeFilter.isTree(json("{\"specifications\": {\"average_height\": {\"cm\": 100}}}"))).isFalse();
    }
}
