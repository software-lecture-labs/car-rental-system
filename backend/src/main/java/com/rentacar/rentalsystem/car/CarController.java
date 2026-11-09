package com.rentacar.rentalsystem.car;

import jakarta.validation.Valid;
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
    public ResponseEntity<CarResponse> addCar(@Valid @RequestBody CarRequest request) {
        Car savedCar = carService.addCar(request.toEntity());
        return new ResponseEntity<>(CarResponse.from(savedCar), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CarResponse>> getAllCars() {
        return ResponseEntity.ok(toResponses(carService.getAllCars()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CarResponse> getCarById(@PathVariable UUID id) {
        return ResponseEntity.ok(CarResponse.from(carService.getCarById(id)));
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

    private static List<CarResponse> toResponses(List<Car> cars) {
        return cars.stream().map(CarResponse::from).toList();
    }
}
