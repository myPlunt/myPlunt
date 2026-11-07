package com.myplunt.species;

import tools.jackson.databind.JsonNode;

import java.util.Locale;
import java.util.Set;

// The PluntDex is for plants people keep at home or in a garden bed, not trees. Two checks: a free one
// on the genus before spending a details request, and one on the details for what the genus misses.
public final class TreeFilter {

    // Big outdoor trees that fill the start of Perenual's alphabetical list. Never a genus people also
    // grow indoors (Ficus, Dracaena, Citrus...): the details check below handles those.
    // shortcut: a hand-kept list; extend it when imports keep skipping a tree genus after its details call.
    private static final Set<String> TREE_GENERA = Set.of(
            "abies", "acer", "aesculus", "ailanthus", "alnus", "araucaria", "betula", "carpinus", "carya",
            "castanea", "catalpa", "cedrus", "celtis", "cercidiphyllum", "chamaecyparis", "cryptomeria",
            "cupressus", "eucalyptus", "fagus", "fraxinus", "ginkgo", "gleditsia", "juglans", "larix",
            "liquidambar", "liriodendron", "metasequoia", "nyssa", "ostrya", "picea", "pinus", "platanus",
            "populus", "pseudotsuga", "quercus", "robinia", "sequoia", "sequoiadendron", "sorbus", "taxodium",
            "thuja", "tilia", "tsuga", "ulmus", "zelkova");

    private static final double MAX_HEIGHT_FEET = 30;

    private TreeFilter() {}

    public static boolean isTreeGenus(String genus) {
        return genus != null && TREE_GENERA.contains(genus.trim().toLowerCase(Locale.ROOT));
    }

    // Indoor plants pass even when Perenual calls them a tree: a fig or a palm in a pot is a houseplant.
    public static boolean isTree(JsonNode details) {
        if (details.path("indoor").asBoolean(false)) {
            return false;
        }
        String type = details.path("type").asString("").toLowerCase(Locale.ROOT);
        if (type.contains("tree") || type.contains("conifer")) {
            return true;
        }
        for (JsonNode dimension : details.path("dimensions")) {
            if ("height".equalsIgnoreCase(dimension.path("type").asString(""))
                    && feet(dimension.path("max_value").asDouble(0), dimension.path("unit").asString("")) > MAX_HEIGHT_FEET) {
                return true;
            }
        }
        return false;
    }

    private static double feet(double value, String unit) {
        return unit.toLowerCase(Locale.ROOT).startsWith("m") ? value * 3.28 : value;
    }
}
