package com.myplunt.species;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OriginRegionsTest {

    @Test
    void regionsOf_givesEveryRegionTheOriginsFallInOnceInTheOrderFirstNamed() {
        // A Mediterranean origin list: no single region holds it.
        assertThat(OriginRegions.regionsOf(List.of("Spain", "France", "Italy", "Greece", "Morocco", "Algeria",
                "Turkey", "Lebanon-Syria", "Baleares")))
                .containsExactly("Southern Europe", "Western Europe", "Balkans", "Northern Africa", "Eurasia",
                        "Middle East");
        assertThat(OriginRegions.regionsOf(List.of("Southeastern United States", "Mexico", "Eastern Canada")))
                .containsExactly("Canada, USA and Mexico");
    }

    @Test
    void match_needsWholeWordsAndTriesSpecificNamesFirst() {
        assertThat(OriginRegions.match("Romania")).isEqualTo("Balkans");
        assertThat(OriginRegions.match("Oman")).isEqualTo("Middle East");
        assertThat(OriginRegions.match("Papua New Guinea")).isEqualTo("Oceania");
        assertThat(OriginRegions.match("Guinea")).isEqualTo("West Africa");
        assertThat(OriginRegions.match("South Sudan")).isEqualTo("East Africa");
        assertThat(OriginRegions.match("Sudan")).isEqualTo("Northern Africa");
        assertThat(OriginRegions.match("Côte d'Ivoire")).isEqualTo("West Africa");
        // Trefle's place names.
        assertThat(OriginRegions.match("Cape Provinces")).isEqualTo("Southern Africa");
        assertThat(OriginRegions.match("Central European Rus")).isEqualTo("Eurasia");
        assertThat(OriginRegions.match("Ohio")).isEqualTo("Canada, USA and Mexico");
        assertThat(OriginRegions.match("Panamá")).isEqualTo("Central America");
    }

    @Test
    void regionsOf_isEmptyWhenNoOriginIsAPluntdexRegion() {
        assertThat(OriginRegions.regionsOf(List.of("Antarctica", "Atlantis"))).isEmpty();
        assertThat(OriginRegions.regionsOf(List.of())).isEmpty();
    }
}
