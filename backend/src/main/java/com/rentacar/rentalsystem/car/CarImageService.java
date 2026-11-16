package com.rentacar.rentalsystem.car;

import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Araç görselleri: yükleme, listeleme, kapak seçme, silme.
 * Bir araçta 0..MAX_IMAGES_PER_CAR görsel olabilir; sort_order en küçük olan kapaktır.
 */
@Service
@RequiredArgsConstructor
public class CarImageService {

    public static final int MAX_IMAGES_PER_CAR = 10;
    public static final int MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    private final CarImageRepository imageRepository;
    private final CarService carService;

    @Transactional
    public List<CarImageSummary> addImages(UUID carId, List<MultipartFile> files) {
        Car car = carService.getCarById(carId);

        if (files == null || files.isEmpty()) {
            throw new InvalidRequestException("At least one image file is required.");
        }
        long existing = imageRepository.countByCar_Id(carId);
        if (existing + files.size() > MAX_IMAGES_PER_CAR) {
            throw new BusinessRuleException("A car can have at most " + MAX_IMAGES_PER_CAR + " images. It already has "
                    + existing + ".");
        }

        int nextOrder = imageRepository.findMaxSortOrder(carId).map(order -> order + 1).orElse(0);
        for (MultipartFile file : files) {
            byte[] bytes = readBytes(file);
            CarImage image = new CarImage();
            image.setCar(car);
            image.setData(bytes);
            image.setSizeBytes(bytes.length);
            image.setContentType(detectContentType(bytes));
            image.setSortOrder(nextOrder++);
            imageRepository.save(image);
        }
        return imageRepository.findByCar_IdOrderBySortOrderAsc(carId);
    }

    @Transactional(readOnly = true)
    public List<CarImageSummary> listImages(UUID carId) {
        carService.getCarById(carId);
        return imageRepository.findByCar_IdOrderBySortOrderAsc(carId);
    }

    @Transactional(readOnly = true)
    public CarImage getImage(UUID carId, UUID imageId) {
        return imageRepository.findByIdAndCar_Id(imageId, carId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));
    }

    @Transactional(readOnly = true)
    public CarImage getCoverImage(UUID carId) {
        return imageRepository.findFirstByCar_IdOrderBySortOrderAsc(carId)
                .orElseThrow(() -> new ResourceNotFoundException("Car has no images: " + carId));
    }

    /** Görseli kapak yapar: sort_order'ını mevcut en küçüğün bir altına çeker. */
    @Transactional
    public List<CarImageSummary> makeCover(UUID carId, UUID imageId) {
        CarImage image = getImage(carId, imageId);
        int smallest = imageRepository.findMinSortOrder(carId).orElse(image.getSortOrder());
        if (image.getSortOrder() > smallest) {
            image.setSortOrder(smallest - 1);
            imageRepository.save(image);
        }
        return imageRepository.findByCar_IdOrderBySortOrderAsc(carId);
    }

    @Transactional
    public void deleteImage(UUID carId, UUID imageId) {
        imageRepository.delete(getImage(carId, imageId));
    }

    private static byte[] readBytes(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidRequestException("Uploaded file '" + file.getOriginalFilename() + "' is empty.");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new InvalidRequestException("Each image must be at most 5 MB.");
        }
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new InvalidRequestException("Uploaded file could not be read.");
        }
    }

    /**
     * Türü dosyanın ilk byte'larına bakarak belirler; tarayıcının gönderdiği Content-Type'a güvenmeyiz
     * (aksi halde "resim" diye HTML/JS yüklenip sitemizden servis edilebilirdi).
     */
    static String detectContentType(byte[] bytes) {
        if (startsWith(bytes, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (startsWith(bytes, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (bytes.length >= 12 && startsWith(bytes, 0x52, 0x49, 0x46, 0x46)
                && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50) {
            return "image/webp";
        }
        throw new InvalidRequestException("Only JPEG, PNG and WebP images are allowed.");
    }

    private static boolean startsWith(byte[] bytes, int... signature) {
        if (bytes.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((bytes[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }
}
