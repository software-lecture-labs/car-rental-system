package com.rentacar.rentalsystem.car;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CarService {

    private final CarRepository carRepository;

    public Car addCar(Car car) {
        if (carRepository.findByPlate(car.getPlate()).isPresent()) {
            throw new IllegalArgumentException("A car with this plate is already registered in the system!");
        }
        return carRepository.save(car);
    }

    public List<Car> getAllCars() {
        return carRepository.findAll();
    }


    public List<Car> getAvailableCars() {
        return carRepository.findByStatus(CarStatus.AVAILABLE);
    }

    public List<Car> getCarsByBrand(String brand) {
        return carRepository.findByBrand(brand);
    }

    public List<Car> getCarsByTransmission(TransmissionType transmission) {
        return carRepository.findByTransmission(transmission);
    }

    public List<Car> getCarsByFuelType(FuelType fuelType) {
        return carRepository.findByFuelType(fuelType);
    }


    public Car getCarById(UUID id) {
        return carRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Car with the specified ID could not be found."));
    }

    public void setCarMaintenance(UUID id) {
        Car car = getCarById(id);

        if (car.getStatus() != CarStatus.AVAILABLE) {
            throw new IllegalStateException("Car is not available right now. It cannot be put into maintenance!");
        }

        car.markAsMaintenance();
        carRepository.save(car);
    }

    public void removeCarFromMaintenance(UUID id) {
        Car car = getCarById(id);

        if (car.getStatus() != CarStatus.MAINTENANCE) {
            throw new IllegalStateException("Car is not in maintenance status!");
        }

        car.markAsAvailable();
        carRepository.save(car);
    }

    public void deleteCar(UUID id) {
        Car car = getCarById(id);

        if (car.getStatus() == CarStatus.RENTED) {
            throw new IllegalStateException("Cannot delete a rented car. Wait for the rental process to complete.");
        }

        carRepository.delete(car);
    }
}