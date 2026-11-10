package com.myplunt.region;

import com.myplunt.region.dto.RegionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegionServiceTest {

    @Mock
    private RegionRepository regionRepository;

    private final Region europe = new Region("Europe", "europe", null, 5);
    private final Region balkans = region("Balkans", "balkans", europe, 10, "Croatia", "Greece");
    private final Region southernEurope = region("Southern Europe", "southern-europe", europe, 11, "Italy");
    private final Region oceania = region("Oceania", "oceania", null, 23, "Australia");

    private static Region region(String name, String slug, Region parent, int position, String... countries) {
        Region region = new Region(name, slug, parent, position);
        region.getCountries().addAll(List.of(countries));
        return region;
    }

    private RegionService service() {
        when(regionRepository.findAllWithCountries()).thenReturn(List.of(europe, balkans, southernEurope, oceania));
        return new RegionService(regionRepository);
    }

    @Test
    void getRegions_givesEachRegionItsParentAndCountries() {
        assertThat(service().getRegions()).containsExactly(
                new RegionResponse(null, "Europe", "europe", null, List.of()),
                new RegionResponse(null, "Balkans", "balkans", "Europe", List.of("Croatia", "Greece")),
                new RegionResponse(null, "Southern Europe", "southern-europe", "Europe", List.of("Italy")),
                new RegionResponse(null, "Oceania", "oceania", null, List.of("Australia")));
    }

    @Test
    void findSpeciesRegions_givesTheRegionsOnceInMapOrder() {
        assertThat(service().findSpeciesRegions(List.of("Oceania", "Southern Europe", "Balkans", "Oceania")))
                .containsExactly(balkans, southernEurope, oceania);
    }

    @Test
    void findSpeciesRegions_refusesAParentAndAnUnknownRegion() {
        RegionService service = service();

        assertThatThrownBy(() -> service.findSpeciesRegions(List.of("Balkans", "Europe")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Choose the parts of Europe");
        assertThatThrownBy(() -> service.findSpeciesRegions(List.of("Mediterranean")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("There is no region called Mediterranean.");
    }
}
