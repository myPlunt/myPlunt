package com.myplunt.species;

import tools.jackson.databind.JsonNode;
import com.myplunt.species.dto.SpeciesImportResponse;
import com.myplunt.storage.StorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Imports one Perenual page (30 species) as pending species, so they go through the normal approval.
@Service
public class SpeciesImportService {

    private static final Pattern NUMBER = Pattern.compile("\\d+");

    private final PerenualClient perenualClient;
    private final SpeciesRepository speciesRepository;
    private final StorageService storageService;

    public SpeciesImportService(PerenualClient perenualClient, SpeciesRepository speciesRepository,
                                StorageService storageService) {
        this.perenualClient = perenualClient;
        this.speciesRepository = speciesRepository;
        this.storageService = storageService;
    }

    // Imports up to count new species, starting at a Perenual page (30 species each) and moving on to the
    // next pages as needed. Each species is saved on its own, so hitting the daily limit keeps what was
    // already imported. nextPage is where the next import should start: the same page while it still
    // has species left to look at.
    public SpeciesImportResponse importSpecies(int count, int startPage) {
        if (!perenualClient.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "The plant API is not set up.");
        }
        int imported = 0;
        int skipped = 0;
        int page = startPage;
        while (true) {
            PerenualClient.Page list;
            try {
                list = perenualClient.list(page);
            } catch (HttpClientErrorException.TooManyRequests e) {
                return new SpeciesImportResponse(imported, skipped, page, true);
            } catch (RestClientException e) {
                if (imported > 0) {
                    return new SpeciesImportResponse(imported, skipped, page, false);
                }
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The plant API is unavailable. Try again later.");
            }
            for (PerenualClient.Item item : list.data()) {
                if (imported == count) {
                    return new SpeciesImportResponse(imported, skipped, page, false);
                }
                String scientificName = first(item.scientific_name());
                // Checked before the details call, so species we already have cost no requests.
                if (scientificName == null || speciesRepository.existsByScientificNameIgnoreCase(scientificName)) {
                    skipped++;
                    continue;
                }
                JsonNode details;
                Species species;
                try {
                    details = perenualClient.details(item.id());
                    species = toSpecies(scientificName, details);
                } catch (HttpClientErrorException.TooManyRequests e) {
                    return new SpeciesImportResponse(imported, skipped, page, true);
                } catch (RestClientException e) {
                    skipped++;
                    continue;
                }
                if (species == null) {
                    skipped++;
                } else {
                    Species saved = speciesRepository.save(species);
                    copyImage(saved, details);
                    imported++;
                }
            }
            if (page >= list.last_page()) {
                return new SpeciesImportResponse(imported, skipped, null, false);
            }
            page++;
            if (imported == count) {
                return new SpeciesImportResponse(imported, skipped, page, false);
            }
        }
    }

    // A species without a picture is still worth importing, so a failed copy is ignored.
    private void copyImage(Species species, JsonNode details) {
        JsonNode image = details.path("default_image");
        String url = text(image.path("regular_url"));
        if (url == null) {
            url = text(image.path("medium_url"));
        }
        if (url == null) {
            return;
        }
        try {
            ResponseEntity<byte[]> response = perenualClient.image(url);
            MediaType type = response.getHeaders().getContentType();
            if (response.getBody() == null || type == null) {
                return;
            }
            String key = storageService.putSpeciesImage(species.getId(), response.getBody(), type.getType() + "/" + type.getSubtype());
            if (key != null) {
                species.setImageKey(key);
                speciesRepository.save(species);
            }
        } catch (RuntimeException e) {
            // Download or storage failed: the admin sees "No picture" and can still approve.
        }
    }

    // Null when the free plan hides the care data: a species without watering is no use in the PluntDex.
    static Species toSpecies(String scientificName, JsonNode details) {
        String commonName = text(details.path("common_name"));
        Integer wateringDays = wateringDays(details);
        if (commonName == null || wateringDays == null) {
            return null;
        }
        return new Species(capitalize(commonName), scientificName, join(details.path("origin")), wateringDays,
                capitalize(join(details.path("sunlight"))));
    }

    // "watering_general_benchmark": {"value": "7-10", "unit": "days"} → 7, the safe end of the range.
    static Integer wateringDays(JsonNode details) {
        JsonNode benchmark = details.path("watering_general_benchmark");
        String value = text(benchmark.path("value"));
        if (value != null) {
            Matcher matcher = NUMBER.matcher(value);
            if (matcher.find()) {
                int amount = Integer.parseInt(matcher.group());
                String unit = String.valueOf(text(benchmark.path("unit"))).toLowerCase(Locale.ROOT);
                int days = unit.startsWith("week") ? amount * 7 : amount;
                if (days > 0) {
                    return Math.min(days, 365);
                }
            }
        }
        String watering = text(details.path("watering"));
        if (watering == null) {
            return null;
        }
        return switch (watering.toLowerCase(Locale.ROOT)) {
            case "frequent" -> 3;
            case "average" -> 7;
            case "minimum" -> 14;
            case "none" -> 30;
            default -> null;
        };
    }

    private static String text(JsonNode node) {
        if (!node.isValueNode() || node.isNull()) {
            return null;
        }
        String value = node.asString().replace("\"", "").trim();
        return value.isEmpty() || value.startsWith("Upgrade") ? null : value;
    }

    // Whole entries only, within the columns' VARCHAR(255): some origin lists name 30+ countries.
    private static String join(JsonNode array) {
        StringBuilder joined = new StringBuilder();
        for (JsonNode part : array) {
            String value = text(part);
            if (value == null) {
                continue;
            }
            String next = joined.isEmpty() ? value : ", " + value;
            if (joined.length() + next.length() > 255) {
                break;
            }
            joined.append(next);
        }
        return joined.isEmpty() ? null : joined.toString();
    }

    private static String first(List<String> values) {
        return values == null || values.isEmpty() || values.get(0).isBlank() ? null : values.get(0).trim();
    }

    private static String capitalize(String value) {
        return value == null ? null : Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
