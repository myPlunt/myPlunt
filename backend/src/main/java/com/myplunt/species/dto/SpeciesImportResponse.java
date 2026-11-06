package com.myplunt.species.dto;

// nextPage is null after the last page; on limitReached it is the same page, to finish it tomorrow.
public record SpeciesImportResponse(int imported, int skipped, Integer nextPage, boolean limitReached) {}
