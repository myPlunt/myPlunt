package com.myplunt.species;

import java.util.List;

// The only regions and sunlight values a species can have: the app's PluntDex groups by the exact text,
// so a typo would show up as its own region. The admin dashboard has a copy in src/lib/species.ts.
public final class SpeciesOptions {
    public static final List<String> REGIONS = List.of(
            "Arabian Peninsula", "Central America", "China", "East Africa", "East Asia", "Europe", "Mediterranean",
            "North America", "South America", "South Asia", "Southeast Asia", "Southern Africa", "Tropical Asia",
            "West Africa");

    public static final List<String> SUNLIGHT = List.of(
            "Full sun", "Bright direct", "Bright indirect", "Indirect", "Low to bright indirect", "Partial shade");

    private SpeciesOptions() {}
}
