package com.rentacar.rentalsystem.rental;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarAvailabilityController {

    private final CarAvailabilityService availabilityService;

    @GetMapping("/available")
    public ResponseEntity<List<AvailableCarResponse>> getAvailableCars(
            @RequestParam @FutureOrPresent @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @Min(1) long days,
            @RequestParam(defaultValue = CarAvailabilityService.SORT_PRICE_ASC) String sort) {

        return ResponseEntity.ok(availabilityService.findAvailableCars(start, days, sort));
    }
}
