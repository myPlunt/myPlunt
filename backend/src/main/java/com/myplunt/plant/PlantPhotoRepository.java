package com.myplunt.plant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PlantPhotoRepository extends JpaRepository<PlantPhoto, UUID> {
}
