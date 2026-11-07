package com.rentacar.rentalsystem.car;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarController {

    private final CarService carService;

    @PostMapping
    public ResponseEntity<Car> addCar(@RequestBody Car car) {
        Car savedCar = carService.addCar(car);
        return new ResponseEntity<>(savedCar, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Car>> getAllCars() {
        return ResponseEntity.ok(carService.getAllCars());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Car>> getAvailableCars() {
        return ResponseEntity.ok(carService.getAvailableCars());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Car> getCarById(@PathVariable UUID id) {
        return ResponseEntity.ok(carService.getCarById(id));
    }

    @PutMapping("/{id}/maintenance")
    public ResponseEntity<String> setCarMaintenance(@PathVariable UUID id) {
        carService.setCarMaintenance(id);
        return ResponseEntity.ok("Car has been put into maintenance.");
    }

    @PutMapping("/{id}/available")
    public ResponseEntity<String> removeCarFromMaintenance(@PathVariable UUID id) {
        carService.removeCarFromMaintenance(id);
        return ResponseEntity.ok("Car has been taken out of maintenance and is now available.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCar(@PathVariable UUID id) {
        carService.deleteCar(id);
        return ResponseEntity.ok("Car has been deleted.");
    }
}