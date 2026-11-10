package com.myplunt.region;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// A PluntDex region. A parent (Europe) only groups its sub-regions: countries and species belong to regions
// without children. Created by migrations; there is no API to change them.
@Entity
@Table(name = "regions")
public class Region {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Region parent;

    @Column(nullable = false)
    private int position;

    @ElementCollection
    @CollectionTable(name = "region_countries", joinColumns = @JoinColumn(name = "region_id"))
    @Column(name = "country")
    @OrderBy
    private List<String> countries = new ArrayList<>();

    protected Region() {}

    public Region(String name, String slug, Region parent, int position) {
        this.name = name;
        this.slug = slug;
        this.parent = parent;
        this.position = position;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public Region getParent() {
        return parent;
    }

    public int getPosition() {
        return position;
    }

    public List<String> getCountries() {
        return countries;
    }
}
