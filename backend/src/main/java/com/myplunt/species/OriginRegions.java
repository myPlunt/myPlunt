package com.myplunt.species;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

// Turns Trefle's native distribution ("Guatemala", "Mexico Gulf", "Cape Provinces") into one of the
// PluntDex regions, which the app's region filter groups species by. Only the regions the seeded
// species already use: an origin outside them (Australia, Central Asia...) gives null, and the admin
// sets the region by hand before approving.
// shortcut: no Oceania or Central Asia region yet; add them here and in the seed when the PluntDex gets them.
public final class OriginRegions {

    // Checked in order and the first match wins, so the more specific names come first
    // ("Papua New Guinea" before "Guinea", "Southern Europe" before "Europe").
    private static final Map<String, String> KEYWORDS = new LinkedHashMap<>();

    static {
        // Names that contain another region's keyword.
        add("Southeast Asia", "papua new guinea", "new guinea");
        add("North America", "indiana");
        add("West Africa", "equatorial guinea", "guinea-bissau");
        add("Southern Africa", "south africa", "southern africa", "cape province", "cape provinces", "kwazulu-natal",
                "northern provinces", "free state");
        add("Mediterranean", "mediterranean", "southern europe", "north africa", "northern africa",
                "spain", "portugal", "italy", "sicily", "sardinia", "corsica", "greece", "crete", "malta", "cyprus",
                "balearic islands", "baleares", "sicilia", "sardegna", "corse", "kriti", "aegean", "canary islands",
                "madeira", "azores", "turkey", "lebanon", "israel",
                "palestine", "syria", "morocco", "algeria", "tunisia", "libya", "egypt");
        add("Europe", "europe", "european", "czechoslovakia", "yugoslavia", "baltic states", "foroyar", "united kingdom", "great britain", "britain", "england", "scotland", "wales",
                "ireland", "france", "germany", "netherlands", "belgium", "luxembourg", "switzerland", "austria",
                "denmark", "norway", "sweden", "finland", "iceland", "poland", "czech republic", "czechia",
                "slovakia", "hungary", "slovenia", "croatia", "bosnia", "serbia", "montenegro", "albania",
                "north macedonia", "macedonia", "kosovo", "bulgaria", "romania", "moldova", "ukraine", "belarus",
                "lithuania", "latvia", "estonia", "russia", "caucasus", "transcaucasus", "armenia", "azerbaijan", "balkans",
                "scandinavia", "alps", "pyrenees", "carpathians");
        add("North America", "north america", "united states", "usa", "u.s.", "canada", "alaska", "hawaii",
                "california", "texas", "florida", "arizona", "nevada", "oregon", "washington", "new mexico",
                "colorado", "utah", "appalachians", "great plains", "rocky mountains", "new england",
                "greenland",
                // Trefle names the US states and Canadian provinces one by one. Georgia is the US state there:
                // the country is "Transcaucasus".
                "alabama", "arkansas", "connecticut", "delaware", "georgia", "idaho", "illinois", "iowa",
                "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota",
                "mississippi", "missouri", "montana", "nebraska", "new hampshire", "new jersey", "new york",
                "north carolina", "north dakota", "ohio", "oklahoma", "pennsylvania", "rhode island",
                "south carolina", "south dakota", "tennessee", "vermont", "virginia", "west virginia",
                "wisconsin", "wyoming", "district of columbia", "ontario", "quebec", "british columbia",
                "alberta", "manitoba", "saskatchewan", "new brunswick", "nova scotia", "newfoundland",
                "labrador", "yukon", "northwest territories", "nunavut", "prince edward");
        add("Central America", "central america", "mexico", "guatemala", "belize", "honduras", "el salvador",
                "nicaragua", "costa rica", "panama", "caribbean", "west indies", "cuba", "jamaica", "haiti",
                "dominican republic", "hispaniola", "puerto rico", "bahamas", "trinidad", "barbados",
                "lesser antilles", "greater antilles", "antilles", "leeward", "windward",
                "cayman");
        add("South America", "south america", "brazil", "argentina", "chile", "peru", "bolivia", "ecuador",
                "colombia", "venezuela", "uruguay", "paraguay", "guyana", "french guiana", "suriname", "andes",
                "patagonia", "amazon", "galapagos");
        add("Arabian Peninsula", "arabian peninsula", "arabia", "saudi arabia", "yemen", "oman",
                "united arab emirates", "qatar", "kuwait", "bahrain", "socotra", "gulf states");
        add("South Asia", "south asia", "india", "sri lanka", "nepal", "bangladesh", "bhutan", "pakistan",
                "himalaya", "himalayas", "assam", "laccadive");
        add("Southeast Asia", "southeast asia", "south-east asia", "thailand", "vietnam", "laos", "cambodia",
                "myanmar", "burma", "malaysia", "indonesia", "philippines", "singapore", "borneo", "brunei",
                "sumatra", "sumatera", "java", "jawa", "sulawesi", "malesia", "malay peninsula", "malaya", "maluku",
                "lesser sunda");
        add("Tropical Asia", "tropical asia");
        add("East Asia", "east asia", "eastern asia", "china", "japan", "korea", "taiwan", "mongolia",
                "hong kong", "tibet", "hainan", "nansei-shoto");
        add("East Africa", "east africa", "eastern africa", "kenya", "tanzania", "uganda", "ethiopia",
                "somalia", "rwanda", "burundi", "sudan", "eritrea", "djibouti", "madagascar");
        add("Southern Africa", "namibia", "botswana", "zimbabwe", "lesotho", "eswatini", "swaziland",
                "mozambique", "angola", "zambia", "malawi");
        add("West Africa", "west africa", "western africa", "tropical africa", "central africa", "nigeria",
                "ghana", "senegal", "ivory coast", "cote d'ivoire", "guinea", "sierra leone", "liberia", "mali",
                "burkina", "niger", "benin", "togo", "gambia", "cameroon", "gabon", "congo", "zaire");
    }

    private static final List<Map.Entry<Pattern, String>> PATTERNS = KEYWORDS.entrySet().stream()
            // Whole words only: "oman" must not match "Romania".
            .map(entry -> Map.entry(Pattern.compile("(^|[^a-z])" + Pattern.quote(entry.getKey()) + "($|[^a-z])"),
                    entry.getValue()))
            .toList();

    private OriginRegions() {}

    private static void add(String region, String... keywords) {
        for (String keyword : keywords) {
            KEYWORDS.putIfAbsent(keyword, region);
        }
    }

    // The region most of the origins fall in; on a tie, the one named first. Null when none match.
    public static String regionOf(List<String> origins) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String origin : origins) {
            String region = match(origin);
            if (region != null) {
                counts.merge(region, 1, Integer::sum);
            }
        }
        return counts.entrySet().stream()
                .reduce((best, next) -> next.getValue() > best.getValue() ? next : best)
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    static String match(String origin) {
        String text = Normalizer.normalize(origin, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        for (Map.Entry<Pattern, String> entry : PATTERNS) {
            if (entry.getKey().matcher(text).find()) {
                return entry.getValue();
            }
        }
        return null;
    }
}
