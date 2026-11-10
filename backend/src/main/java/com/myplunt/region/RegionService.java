package com.myplunt.region;

import com.myplunt.region.dto.RegionResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RegionService {

    private final RegionRepository regionRepository;

    public RegionService(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    @Transactional(readOnly = true)
    public List<RegionResponse> getRegions() {
        return regionRepository.findAllWithCountries().stream()
                .map(region -> new RegionResponse(
                        region.getId(),
                        region.getName(),
                        region.getSlug(),
                        region.getParent() == null ? null : region.getParent().getName(),
                        List.copyOf(region.getCountries())))
                .toList();
    }

    // The regions a species can be put in, by name. A parent like Europe is refused: the species goes in its
    // sub-regions, so filtering by Europe still finds it through them.
    @Transactional(readOnly = true)
    public List<Region> findSpeciesRegions(List<String> names) {
        List<Region> all = regionRepository.findAllWithCountries();
        Map<String, Region> byName = all.stream().collect(Collectors.toMap(Region::getName, Function.identity()));
        Set<Region> parents = all.stream().map(Region::getParent).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Region> regions = new LinkedHashSet<>();
        for (String name : names) {
            Region region = byName.get(name);
            if (region == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "There is no region called " + name + ".");
            }
            if (parents.contains(region)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Choose the parts of " + name + " the plant grows in instead of " + name + " itself.");
            }
            regions.add(region);
        }
        return regions.stream().sorted((a, b) -> Integer.compare(a.getPosition(), b.getPosition())).toList();
    }
}
