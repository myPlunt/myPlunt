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
        assertThat(TreeFilter.isTreeGenus("Abies")).isTrue();
        assertThat(TreeFilter.isTreeGenus("Acer")).isTrue();
        assertThat(TreeFilter.isTreeGenus("Ficus")).isFalse();
        assertThat(TreeFilter.isTreeGenus(null)).isFalse();
    }

    @Test
    void isTree_byTypeOrHeight_unlessItIsAnIndoorPlant() {
        // Abies alba's real Perenual details.
        assertThat(TreeFilter.isTree(json("""
                {"type": "tree", "indoor": false, "dimensions": [{"type": "Height", "max_value": 60, "unit": "feet"}]}
                """))).isTrue();
        assertThat(TreeFilter.isTree(json("""
                {"type": "Deciduous shrub", "indoor": false, "dimensions": [{"type": "Height", "max_value": 15, "unit": "meters"}]}
                """))).isTrue();
        assertThat(TreeFilter.isTree(json("""
                {"type": "tree", "indoor": true, "dimensions": [{"type": "Height", "max_value": 50, "unit": "feet"}]}
                """))).isFalse();
        assertThat(TreeFilter.isTree(json("""
                {"type": "Flower", "indoor": false, "dimensions": [{"type": "Height", "max_value": 2, "unit": "feet"}]}
                """))).isFalse();
    }
}
