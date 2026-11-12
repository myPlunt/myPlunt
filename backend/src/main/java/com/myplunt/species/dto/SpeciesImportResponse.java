package com.myplunt.species.dto;

// nextPage is the Trefle page the next import starts at; null after the last page.
public record SpeciesImportResponse(int imported, int skipped, Integer nextPage, boolean limitReached) {}
