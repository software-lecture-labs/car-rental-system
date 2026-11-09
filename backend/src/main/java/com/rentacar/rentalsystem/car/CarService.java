package com.rentacar.rentalsystem.car;

import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
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
            throw new BusinessRuleException("A car with plate " + car.getPlate() + " is already registered.");
        }
        return carRepository.save(car);
    }

    public List<Car> getAllCars() {
        return carRepository.findAll();
    }


    public List<Car> getCarsNotInMaintenance() {
        return carRepository.findByStatusNot(CarStatus.MAINTENANCE);
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
                .orElseThrow(() -> new ResourceNotFoundException("Car not found: " + id));
    }

    public void setCarMaintenance(UUID id) {
        Car car = getCarById(id);

        if (car.getStatus() != CarStatus.AVAILABLE) {
            throw new BusinessRuleException("Only an available car can be put into maintenance.");
        }

        car.markAsMaintenance();
        carRepository.save(car);
    }

    public void removeCarFromMaintenance(UUID id) {
        Car car = getCarById(id);

        if (car.getStatus() != CarStatus.MAINTENANCE) {
            throw new BusinessRuleException("Car is not in maintenance.");
        }

        car.markAsAvailable();
        carRepository.save(car);
    }

    public void deleteCar(UUID id) {
        Car car = getCarById(id);

        if (car.getStatus() == CarStatus.RENTED) {
            throw new BusinessRuleException("A rented car cannot be deleted. Wait until it is returned.");
        }

        carRepository.delete(car);
    }
}
