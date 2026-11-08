package com.myplunt.species;

import tools.jackson.databind.JsonNode;

import java.util.Locale;
import java.util.Set;

// The PluntDex is for plants people keep at home, and Trefle can't tell us which those are. Two checks:
// a free one on the name before spending a details request, and one on the details for the trees and
// grasses the name misses.
public final class HouseplantFilter {

    // Genera that are nearly all kept indoors. A genus with outdoor or wild species (mint, Sedum, most
    // ferns) doesn't belong here: its indoor species go in HOUSEPLANT_SPECIES.
    // shortcut: hand-kept lists; extend them when a plant people grow never shows up in imports.
    private static final Set<String> HOUSEPLANT_GENERA = Set.of(
            // Aroids and foliage
            "aglaonema", "alocasia", "anthurium", "aspidistra", "beaucarnea", "begonia", "caladium",
            "chlorophytum", "codiaeum", "cordyline", "dieffenbachia", "dracaena", "epipremnum",
            "fittonia", "hypoestes", "monstera", "pachira", "peperomia", "philodendron", "pilea",
            "plectranthus", "radermachera", "rhaphidophora", "sansevieria", "schefflera", "scindapsus",
            "soleirolia", "spathiphyllum", "strelitzia", "syngonium", "zamioculcas",
            // Prayer plants
            "calathea", "ctenanthe", "goeppertia", "maranta", "stromanthe",
            // Ferns and palms
            "chamaedorea", "davallia", "dypsis", "howea", "nephrolepis", "platycerium", "rhapis",
            // Flowering
            "aeschynanthus", "clivia", "columnea", "gardenia", "hippeastrum", "hoya", "kalanchoe",
            "pelargonium", "saintpaulia", "stephanotis", "streptocarpus",
            // Orchids and bromeliads
            "aechmea", "cattleya", "dendrobium", "guzmania", "neoregelia", "oncidium", "paphiopedilum",
            "phalaenopsis", "tillandsia", "vanda", "vriesea",
            // Succulents and cacti
            "adenium", "aeonium", "aloe", "ceropegia", "crassula", "curio", "echeveria", "echinopsis",
            "gasteria", "graptopetalum", "haworthia", "lithops", "mammillaria", "schlumbergera");

    // The indoor species of genera that are otherwise outdoor or wild.
    private static final Set<String> HOUSEPLANT_SPECIES = Set.of(
            "adiantum raddianum", "asplenium nidus", "cyclamen persicum", "ficus benjamina", "ficus elastica",
            "ficus lyrata", "ficus pumila", "hibiscus rosa-sinensis", "jasminum polyanthum", "pteris cretica",
            "sedum morganianum", "tradescantia fluminensis", "tradescantia pallida", "tradescantia spathacea",
            "tradescantia zebrina");

    private static final int MAX_HEIGHT_CM = 900;

    private HouseplantFilter() {}

    public static boolean isHouseplant(String scientificName) {
        String[] words = scientificName.trim().toLowerCase(Locale.ROOT).split("\\s+");
        return HOUSEPLANT_GENERA.contains(words[0])
                || (words.length > 1 && HOUSEPLANT_SPECIES.contains(words[0] + " " + words[1]));
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
