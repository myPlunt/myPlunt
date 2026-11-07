package com.myplunt.species;

import com.myplunt.species.dto.SpeciesImportResponse;
import com.myplunt.storage.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.List;

// Imports Trefle species as pending species, so they go through the normal approval. Trefle has no
// watering and rarely light, so the admin sets those with Edit before approving.
@Service
public class SpeciesImportService {

    private final TrefleClient trefleClient;
    private final SpeciesRepository speciesRepository;
    private final StorageService storageService;

    public SpeciesImportService(TrefleClient trefleClient, SpeciesRepository speciesRepository,
                                StorageService storageService) {
        this.trefleClient = trefleClient;
        this.speciesRepository = speciesRepository;
        this.storageService = storageService;
    }

    // Imports up to count new species, starting at a Trefle page (20 species each) and moving on to the
    // next pages as needed. Each species is saved on its own, so hitting the rate limit keeps what was
    // already imported. nextPage is where the next import should start: the same page while it still
    // has species left to look at.
    public SpeciesImportResponse importSpecies(int count, int startPage) {
        if (!trefleClient.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "The plant API is not set up.");
        }
        int imported = 0;
        int skipped = 0;
        int page = startPage;
        while (true) {
            TrefleClient.Page list;
            try {
                list = trefleClient.list(page);
            } catch (HttpClientErrorException.TooManyRequests e) {
                return new SpeciesImportResponse(imported, skipped, page, true);
            } catch (RestClientException e) {
                if (imported > 0) {
                    return new SpeciesImportResponse(imported, skipped, page, false);
                }
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The plant API is unavailable. Try again later.");
            }
            for (TrefleClient.Item item : list.data()) {
                if (imported == count) {
                    return new SpeciesImportResponse(imported, skipped, page, false);
                }
                String scientificName = blankToNull(item.scientific_name());
                // Checked before the details call, so trees and species we already have cost no requests.
                if (scientificName == null || blankToNull(item.common_name()) == null
                        || TreeFilter.isTreeGenus(genus(item, scientificName))
                        || speciesRepository.existsByScientificNameIgnoreCase(scientificName)) {
                    skipped++;
                    continue;
                }
                Species species;
                try {
                    species = toSpecies(item, trefleClient.details(item.id()));
                } catch (HttpClientErrorException.TooManyRequests e) {
                    return new SpeciesImportResponse(imported, skipped, page, true);
                } catch (RestClientException e) {
                    skipped++;
                    continue;
                }
                if (species == null) {
                    skipped++;
                } else {
                    copyImage(speciesRepository.save(species), item.image_url());
                    imported++;
                }
            }
            if (page >= list.lastPage()) {
                return new SpeciesImportResponse(imported, skipped, null, false);
            }
            page++;
            if (imported == count) {
                return new SpeciesImportResponse(imported, skipped, page, false);
            }
        }
    }

    // Null for trees. Watering stays empty: Trefle has no watering data.
    static Species toSpecies(TrefleClient.Item item, JsonNode details) {
        if (details == null || TreeFilter.isTree(details)) {
            return null;
        }
        return new Species(capitalize(item.common_name().trim()), item.scientific_name().trim(),
                OriginRegions.regionOf(nativeRegions(details)), null, sunlight(details.path("growth").path("light")));
    }

    // Trefle's light goes from 0 (no light) to 10 (very intense).
    static String sunlight(JsonNode light) {
        if (!light.isNumber()) {
            return null;
        }
        int value = light.asInt();
        return value <= 3 ? "Full shade" : value <= 6 ? "Part shade" : "Full sun";
    }

    // "distribution.native" is a plain list of names, e.g. ["Guatemala", "Mexico Gulf"].
    private static List<String> nativeRegions(JsonNode details) {
        List<String> names = new ArrayList<>();
        details.path("distribution").path("native").forEach(name -> {
            if (name.isString() && !name.asString().isBlank()) {
                names.add(name.asString());
            }
        });
        return names;
    }

    // A species without a picture is still worth importing, so a failed copy is ignored.
    private void copyImage(Species species, String url) {
        if (blankToNull(url) == null) {
            return;
        }
        try {
            ResponseEntity<byte[]> response = trefleClient.image(url);
            MediaType type = response.getHeaders().getContentType();
            if (response.getBody() == null || type == null) {
                return;
            }
            String key = storageService.putSpeciesImage(species.getId(), response.getBody(),
                    type.getType() + "/" + type.getSubtype());
            if (key != null) {
                species.setImageKey(key);
                speciesRepository.save(species);
            }
        } catch (RuntimeException e) {
            // Download or storage failed: the admin sees "No picture" and can still approve.
        }
    }

    // The list's genus, or the first word of the scientific name when the list leaves it out.
    private static String genus(TrefleClient.Item item, String scientificName) {
        return blankToNull(item.genus()) != null ? item.genus() : scientificName.split("\\s+")[0];
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private static String capitalize(String value) {
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
