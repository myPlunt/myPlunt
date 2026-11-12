package com.myplunt.species;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

// Turns Trefle's native distribution ("Guatemala", "Mexico Gulf", "Cape Provinces") into the PluntDex regions
// (the regions table) the plant grows in. Only regions without children: Europe's countries go to its
// sub-regions. Names nothing here knows give no region, and the admin adds it by hand before approving.
public final class OriginRegions {

    // Checked in order and the first match wins, so the more specific names come first
    // ("Papua New Guinea" before "Guinea", "South Sudan" before "Sudan").
    private static final Map<String, String> KEYWORDS = new LinkedHashMap<>();

    static {
        // Names that contain another region's keyword.
        add("Oceania", "papua new guinea", "new guinea");
        add("Canada, USA and Mexico", "indiana", "new mexico");
        add("Central Africa", "equatorial guinea", "gulf of guinea is.");
        add("West Africa", "guinea-bissau");
        add("East Africa", "south sudan");
        add("Southern Africa", "south africa", "southern africa", "cape province", "cape provinces", "kwazulu-natal",
                "northern provinces", "free state");
        add("Eurasia", "central european rus", "east european russia", "north european russia",
                "south european russia", "northwest european r");
        add("Scandinavia and Nordics", "scandinavia", "denmark", "norway", "sweden", "finland", "iceland", "foroyar",
                "faroe");
        add("Western Europe", "united kingdom", "great britain", "britain", "england", "scotland", "wales", "ireland",
                "france", "corsica", "corse", "netherlands", "belgium", "luxembourg", "pyrenees");
        add("Central Europe", "germany", "switzerland", "austria", "poland", "czech republic", "czechia",
                "czechoslovakia", "slovakia", "hungary", "alps");
        add("Eastern Europe", "baltic states", "lithuania", "latvia", "estonia", "belarus", "ukraine", "moldova",
                "carpathians");
        add("Balkans", "balkans", "yugoslavia", "slovenia", "croatia", "bosnia", "serbia", "montenegro", "albania",
                "north macedonia", "macedonia", "kosovo", "bulgaria", "romania", "greece", "crete", "kriti", "aegean");
        add("Southern Europe", "southern europe", "mediterranean", "spain", "portugal", "italy", "sicily", "sicilia",
                "sardinia", "sardegna", "malta", "cyprus", "balearic islands", "baleares", "canary islands",
                "madeira", "azores", "andorra");
        add("Eurasia", "russia", "siberia", "caucasus", "transcaucasus", "armenia", "azerbaijan", "turkey");
        add("Northern Africa", "north africa", "northern africa", "morocco", "algeria", "tunisia", "libya", "egypt",
                "sudan", "western sahara");
        add("Middle East", "middle east", "arabian peninsula", "arabia", "saudi arabia", "yemen", "oman",
                "united arab emirates", "qatar", "kuwait", "bahrain", "socotra", "gulf states", "lebanon", "israel",
                "palestine", "syria", "iraq", "iran", "jordan", "sinai");
        add("Central Asia", "central asia", "middle asia", "kazakhstan", "kyrgyzstan", "tajikistan", "turkmenistan",
                "uzbekistan");
        add("Canada, USA and Mexico", "north america", "united states", "usa", "u.s.", "canada", "alaska", "hawaii",
                "california", "texas", "florida", "arizona", "nevada", "oregon", "washington", "colorado", "utah",
                "appalachians", "great plains", "rocky mountains", "new england", "mexico",
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
        add("Greenland", "greenland");
        add("Central America", "central america", "guatemala", "belize", "honduras", "el salvador", "nicaragua",
                "costa rica", "panama");
        add("The Caribbean", "caribbean", "west indies", "cuba", "jamaica", "haiti", "dominican republic",
                "hispaniola", "puerto rico", "bahamas", "trinidad", "barbados", "lesser antilles", "greater antilles",
                "antilles", "leeward", "windward", "cayman", "bermuda");
        add("South America", "south america", "brazil", "argentina", "chile", "peru", "bolivia", "ecuador",
                "colombia", "venezuela", "uruguay", "paraguay", "guyana", "french guiana", "suriname", "andes",
                "patagonia", "amazon", "galapagos");
        add("Southern Asia", "south asia", "india", "sri lanka", "nepal", "bangladesh", "bhutan", "pakistan",
                "afghanistan", "maldives", "himalaya", "himalayas", "assam", "laccadive");
        add("Southeast Asia", "southeast asia", "south-east asia", "tropical asia", "thailand", "vietnam", "laos",
                "cambodia", "myanmar", "burma", "malaysia", "indonesia", "philippines", "singapore", "borneo",
                "brunei", "sumatra", "sumatera", "java", "jawa", "sulawesi", "malesia", "malay peninsula", "malaya",
                "maluku", "lesser sunda", "timor");
        add("Eastern Asia", "east asia", "eastern asia", "china", "japan", "korea", "taiwan", "mongolia",
                "hong kong", "tibet", "hainan", "nansei-shoto");
        add("Oceania", "australia", "new zealand", "new south wales", "queensland", "tasmania", "fiji", "samoa",
                "tonga", "vanuatu", "solomon", "new caledonia");
        add("East Africa", "east africa", "eastern africa", "kenya", "tanzania", "uganda", "ethiopia", "somalia",
                "eritrea", "djibouti");
        add("Central Africa", "central africa", "cameroon", "gabon", "congo", "zaire", "chad", "rwanda", "burundi");
        add("Southern Africa", "namibia", "botswana", "zimbabwe", "lesotho", "eswatini", "swaziland", "mozambique",
                "angola", "zambia", "malawi", "madagascar", "mauritius", "reunion", "comoros", "seychelles");
        add("West Africa", "west africa", "western africa", "tropical africa", "nigeria", "ghana", "senegal",
                "ivory coast", "cote d'ivoire", "guinea", "sierra leone", "liberia", "mali", "burkina", "niger",
                "benin", "togo", "gambia", "mauritania", "cape verde");
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

    // Every region any of the origins falls in, in the order first named. Empty when none match.
    public static List<String> regionsOf(List<String> origins) {
        Set<String> regions = new LinkedHashSet<>();
        for (String origin : origins) {
            String region = match(origin);
            if (region != null) {
                regions.add(region);
            }
        }
        return new ArrayList<>(regions);
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
