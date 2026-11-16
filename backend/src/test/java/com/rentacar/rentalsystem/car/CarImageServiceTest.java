package com.rentacar.rentalsystem.car;

import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CarImageServiceTest {

    static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x01};
    static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
    static final byte[] WEBP = {0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56};

    private CarImageRepository imageRepository;
    private CarService carService;
    private CarImageService service;

    private UUID carId;
    private Car car;

    @BeforeEach
    void setUp() {
        imageRepository = mock(CarImageRepository.class);
        carService = mock(CarService.class);
        service = new CarImageService(imageRepository, carService);

        carId = UUID.randomUUID();
        car = new Car();
        car.setId(carId);
        when(carService.getCarById(carId)).thenReturn(car);
    }

    @Test
    void addImagesDetectsTypeFromContentAndContinuesSortOrder() {
        when(imageRepository.countByCar_Id(carId)).thenReturn(1L);
        when(imageRepository.findMaxSortOrder(carId)).thenReturn(Optional.of(0));
        // tarayıcının söylediği tür yanlış olsa bile dosyanın içeriğine bakılır
        List<MultipartFile> files = List.of(
                new MockMultipartFile("files", "on.png", "text/plain", PNG),
                new MockMultipartFile("files", "yan.jpg", "application/octet-stream", JPEG));

        service.addImages(carId, files);

        ArgumentCaptor<CarImage> saved = ArgumentCaptor.forClass(CarImage.class);
        verify(imageRepository, times(2)).save(saved.capture());
        CarImage first = saved.getAllValues().get(0);
        CarImage second = saved.getAllValues().get(1);
        assertThat(first.getContentType()).isEqualTo("image/png");
        assertThat(first.getSortOrder()).isEqualTo(1);
        assertThat(first.getSizeBytes()).isEqualTo(PNG.length);
        assertThat(first.getCar()).isSameAs(car);
        assertThat(second.getContentType()).isEqualTo("image/jpeg");
        assertThat(second.getSortOrder()).isEqualTo(2);
    }

    @Test
    void firstImageOfACarGetsSortOrderZero() {
        when(imageRepository.countByCar_Id(carId)).thenReturn(0L);
        when(imageRepository.findMaxSortOrder(carId)).thenReturn(Optional.empty());

        service.addImages(carId, List.of(new MockMultipartFile("files", "a.webp", "image/webp", WEBP)));

        ArgumentCaptor<CarImage> saved = ArgumentCaptor.forClass(CarImage.class);
        verify(imageRepository).save(saved.capture());
        assertThat(saved.getValue().getSortOrder()).isZero();
        assertThat(saved.getValue().getContentType()).isEqualTo("image/webp");
    }

    @Test
    void nonImageFileIsRejected() {
        when(imageRepository.countByCar_Id(carId)).thenReturn(0L);
        when(imageRepository.findMaxSortOrder(carId)).thenReturn(Optional.empty());
        MultipartFile html = new MockMultipartFile("files", "x.png", "image/png", "<html>".getBytes());

        assertThatThrownBy(() -> service.addImages(carId, List.of(html)))
                .isInstanceOf(InvalidRequestException.class);
        verify(imageRepository, never()).save(any());
    }

    @Test
    void emptyFileIsRejected() {
        when(imageRepository.countByCar_Id(carId)).thenReturn(0L);
        when(imageRepository.findMaxSortOrder(carId)).thenReturn(Optional.empty());
        MultipartFile empty = new MockMultipartFile("files", "bos.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> service.addImages(carId, List.of(empty)))
                .isInstanceOf(InvalidRequestException.class);
        verify(imageRepository, never()).save(any());
    }

    @Test
    void moreThanTenImagesPerCarIsRejected() {
        when(imageRepository.countByCar_Id(carId)).thenReturn(9L);
        List<MultipartFile> files = List.of(
                new MockMultipartFile("files", "a.png", "image/png", PNG),
                new MockMultipartFile("files", "b.png", "image/png", PNG));

        assertThatThrownBy(() -> service.addImages(carId, files))
                .isInstanceOf(BusinessRuleException.class);
        verify(imageRepository, never()).save(any());
    }

    @Test
    void makeCoverMovesImageBeforeCurrentCover() {
        UUID imageId = UUID.randomUUID();
        CarImage image = new CarImage();
        image.setId(imageId);
        image.setSortOrder(3);
        when(imageRepository.findByIdAndCar_Id(imageId, carId)).thenReturn(Optional.of(image));
        when(imageRepository.findMinSortOrder(carId)).thenReturn(Optional.of(0));

        service.makeCover(carId, imageId);

        assertThat(image.getSortOrder()).isEqualTo(-1);
        verify(imageRepository).save(image);
    }

    @Test
    void coverOfCarWithoutImagesIsNotFound() {
        when(imageRepository.findFirstByCar_IdOrderBySortOrderAsc(carId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCoverImage(carId)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void imageOfAnotherCarIsNotFound() {
        UUID imageId = UUID.randomUUID();
        when(imageRepository.findByIdAndCar_Id(imageId, carId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteImage(carId, imageId)).isInstanceOf(ResourceNotFoundException.class);
        verify(imageRepository, never()).delete(any());
    }
}
