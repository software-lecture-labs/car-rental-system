package com.rentacar.rentalsystem.car;

import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CarServiceTest {

    private CarRepository repository;
    private CarService service;

    @BeforeEach
    void setUp() {
        repository = mock(CarRepository.class);
        service = new CarService(repository);
    }

    @Test
    void updateCarChangesDetailsButKeepsPlateAndStatus() {
        UUID id = UUID.randomUUID();
        Car car = new Car();
        car.setId(id);
        car.setBrand("Fiat");
        car.setModel("Egea");
        car.setProductionYear(2020);
        car.setFuelType(FuelType.GASOLINE);
        car.setTransmission(TransmissionType.MANUAL);
        car.setColor("Beyaz");
        car.setPlate("34ABC123");
        car.setSeatCount(5);
        car.setDailyBasePrice(new BigDecimal("1000.00"));
        car.setStatus(CarStatus.RENTED);
        when(repository.findById(id)).thenReturn(Optional.of(car));
        when(repository.save(car)).thenReturn(car);

        Car updated = service.updateCar(id, new CarUpdateRequest(" Renault ", " Clio ", 2023, FuelType.HYBRID,
                TransmissionType.AUTOMATIC, " Kırmızı ", 4, new BigDecimal("1500.00")));

        assertThat(updated.getBrand()).isEqualTo("Renault");
        assertThat(updated.getModel()).isEqualTo("Clio");
        assertThat(updated.getProductionYear()).isEqualTo(2023);
        assertThat(updated.getFuelType()).isEqualTo(FuelType.HYBRID);
        assertThat(updated.getTransmission()).isEqualTo(TransmissionType.AUTOMATIC);
        assertThat(updated.getColor()).isEqualTo("Kırmızı");
        assertThat(updated.getSeatCount()).isEqualTo(4);
        assertThat(updated.getDailyBasePrice()).isEqualByComparingTo("1500.00");
        assertThat(updated.getPlate()).isEqualTo("34ABC123");
        assertThat(updated.getStatus()).isEqualTo(CarStatus.RENTED);
        verify(repository).save(car);
    }

    @Test
    void updateCarThrowsWhenCarDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        CarUpdateRequest request = new CarUpdateRequest("Renault", "Clio", 2023, FuelType.HYBRID,
                TransmissionType.AUTOMATIC, "Kırmızı", 4, new BigDecimal("1500.00"));

        assertThatThrownBy(() -> service.updateCar(id, request)).isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).save(any());
    }
}
