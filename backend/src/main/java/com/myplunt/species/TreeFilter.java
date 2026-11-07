package com.myplunt.species;

import tools.jackson.databind.JsonNode;

import java.util.Locale;
import java.util.Set;

// The PluntDex is for plants people keep at home or in a garden bed, not trees (or lawn grasses). Two
// checks: a free one on the genus before spending a details request, and one on the details for what
// the genus misses.
public final class TreeFilter {

    // Big outdoor trees. Never a genus people also grow in pots (Ficus, Dracaena, Citrus...).
    // shortcut: a hand-kept list; extend it when imports keep skipping a tree genus after its details call.
    private static final Set<String> TREE_GENERA = Set.of(
            "abies", "acer", "aesculus", "ailanthus", "alnus", "araucaria", "betula", "carpinus", "carya",
            "castanea", "catalpa", "cedrus", "celtis", "cercidiphyllum", "chamaecyparis", "cryptomeria",
            "cupressus", "eucalyptus", "fagus", "fraxinus", "ginkgo", "gleditsia", "juglans", "larix",
            "liquidambar", "liriodendron", "metasequoia", "nyssa", "ostrya", "picea", "pinus", "platanus",
            "populus", "pseudotsuga", "quercus", "robinia", "salix", "sequoia", "sequoiadendron", "sorbus",
            "taxodium", "thuja", "tilia", "tsuga", "ulmus", "zelkova");

    private static final int MAX_HEIGHT_CM = 900;

    private TreeFilter() {}

    public static boolean isTreeGenus(String genus) {
        return genus != null && TREE_GENERA.contains(genus.trim().toLowerCase(Locale.ROOT));
    }

    // Trefle's specifications: ligneous_type "tree", growth_habit "Tree" or "Graminoid", or taller than 9 m.
    public static boolean isTree(JsonNode details) {
        JsonNode specifications = details.path("specifications");
        String ligneous = specifications.path("ligneous_type").asString("").toLowerCase(Locale.ROOT);
        String habit = specifications.path("growth_habit").asString("").toLowerCase(Locale.ROOT);
        if (ligneous.equals("tree") || habit.contains("tree") || habit.contains("graminoid")) {
            return true;
        }
        int height = Math.max(specifications.path("maximum_height").path("cm").asInt(0),
                specifications.path("average_height").path("cm").asInt(0));
        return height > MAX_HEIGHT_CM;
    }
}
