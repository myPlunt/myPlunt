package com.myplunt.species;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OriginRegionsTest {

    @Test
    void regionOf_groupsCountriesIntoTheRegionMostOfThemAreIn() {
        // Abies alba's real Perenual origin list.
        assertThat(OriginRegions.regionOf(List.of("Austria", "Germany", "Switzerland", "France", "Italy", "Slovenia",
                "Croatia", "Bosnia and Herzegovina", "Serbia", "Montenegro", "Albania", "Bulgaria", "Romania")))
                .isEqualTo("Europe");
        assertThat(OriginRegions.regionOf(List.of("Southeastern United States", "Mexico", "Eastern Canada")))
                .isEqualTo("North America");
    }

    @Test
    void match_needsWholeWordsAndTriesSpecificNamesFirst() {
        assertThat(OriginRegions.match("Romania")).isEqualTo("Europe");
        assertThat(OriginRegions.match("Oman")).isEqualTo("Arabian Peninsula");
        assertThat(OriginRegions.match("Papua New Guinea")).isEqualTo("Southeast Asia");
        assertThat(OriginRegions.match("Guinea")).isEqualTo("West Africa");
        assertThat(OriginRegions.match("New Mexico")).isEqualTo("North America");
        assertThat(OriginRegions.match("Côte d'Ivoire")).isEqualTo("West Africa");
    }

    @Test
    void regionOf_isNullWhenNoOriginIsAPluntdexRegion() {
        assertThat(OriginRegions.regionOf(List.of("Australia", "New Zealand"))).isNull();
        assertThat(OriginRegions.regionOf(List.of())).isNull();
    }
}
