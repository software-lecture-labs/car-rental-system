package com.rentacar.rentalsystem.car;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * GET'ler herkese açık (site ziyaretçisi görselleri görebilsin), diğerleri sadece ADMIN (SecurityConfig).
 *
 * Frontend için:
 * - Liste sayfası kapak: <img src="{API}/api/cars/{carId}/images/cover"> (görsel yoksa 404 -> yer tutucu göster)
 * - Detay sayfası galeri: GET /api/cars/{carId}/images -> her elemanın url'i
 * - Yükleme: multipart/form-data, alan adı "files" (bir ya da birden fazla dosya)
 */
@RestController
@RequestMapping("/api/cars/{carId}/images")
@RequiredArgsConstructor
public class CarImageController {

    private final CarImageService imageService;

    @GetMapping
    public ResponseEntity<List<CarImageResponse>> listImages(@PathVariable UUID carId) {
        return ResponseEntity.ok(CarImageResponse.fromAll(carId, imageService.listImages(carId)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<CarImageResponse>> uploadImages(@PathVariable UUID carId,
                                                               @RequestParam("files") List<MultipartFile> files) {
        List<CarImageSummary> images = imageService.addImages(carId, files);
        return new ResponseEntity<>(CarImageResponse.fromAll(carId, images), HttpStatus.CREATED);
    }

    /** Kapak değişebildiği için kısa süre önbelleğe alınır. */
    @GetMapping("/cover")
    public ResponseEntity<byte[]> getCoverImage(@PathVariable UUID carId) {
        return imageResponse(imageService.getCoverImage(carId), Duration.ofMinutes(1));
    }

    /** Bir görselin içeriği hiç değişmez (yeni görsel = yeni id), uzun süre önbelleğe alınabilir. */
    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> getImage(@PathVariable UUID carId, @PathVariable UUID imageId) {
        return imageResponse(imageService.getImage(carId, imageId), Duration.ofDays(365));
    }

    @PutMapping("/{imageId}/cover")
    public ResponseEntity<List<CarImageResponse>> makeCover(@PathVariable UUID carId, @PathVariable UUID imageId) {
        return ResponseEntity.ok(CarImageResponse.fromAll(carId, imageService.makeCover(carId, imageId)));
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID carId, @PathVariable UUID imageId) {
        imageService.deleteImage(carId, imageId);
        return ResponseEntity.noContent().build();
    }

    private static ResponseEntity<byte[]> imageResponse(CarImage image, Duration cacheFor) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .contentLength(image.getSizeBytes())
                .cacheControl(CacheControl.maxAge(cacheFor).cachePublic())
                .body(image.getData());
    }
}
