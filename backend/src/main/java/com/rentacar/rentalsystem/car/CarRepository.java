package com.rentacar.rentalsystem.car;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CarRepository extends JpaRepository<Car, UUID> {

    Optional<Car> findByPlate(String plate);

    List<Car> findByStatus(CarStatus status);

    List<Car> findByBrand(String brand);

    List<Car> findByTransmission(TransmissionType transmission);

    List<Car> findByFuelType(FuelType fuelType);
}