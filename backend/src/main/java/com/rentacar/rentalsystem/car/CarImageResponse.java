package com.rentacar.rentalsystem.car;

import java.util.List;
import java.util.UUID;

/**
 * url: frontend'in <img src> olarak kullanacağı adres (API adresinin önüne eklenir).
 * cover: listedeki ilk görsel kapaktır.
 */
public record CarImageResponse(
        UUID id,
        String url,
        String contentType,
        int sizeBytes,
        boolean cover
) {

    public static List<CarImageResponse> fromAll(UUID carId, List<CarImageSummary> images) {
        return images.stream()
                .map(image -> new CarImageResponse(
                        image.getId(),
                        "/api/cars/" + carId + "/images/" + image.getId(),
                        image.getContentType(),
                        image.getSizeBytes(),
                        image.getId().equals(images.getFirst().getId())))
                .toList();
    }
}
