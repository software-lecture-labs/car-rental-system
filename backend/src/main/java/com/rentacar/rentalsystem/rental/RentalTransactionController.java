package com.rentacar.rentalsystem.rental;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
public class RentalTransactionController {

    private final RentalTransactionService transactionService;

    public record RentalRequest(
            UUID customerId,
            UUID carId,
            String selectedPackage,
            LocalDateTime startDate,
            long rentalDays
    ) {}

    @PostMapping
    public ResponseEntity<RentalTransaction> rentCar(@RequestBody RentalRequest request) {
        RentalTransaction transaction = transactionService.rentCar(
                request.customerId(),
                request.carId(),
                request.selectedPackage(),
                request.startDate(),
                request.rentalDays()
        );
        return new ResponseEntity<>(transaction, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<String> returnCar(@PathVariable UUID id) {
        transactionService.returnCar(id);
        return ResponseEntity.ok("Car has been returned and the rental is completed.");
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentalTransaction> getTransactionById(@PathVariable UUID id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }

    @GetMapping
    public ResponseEntity<List<RentalTransaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<RentalTransaction>> getTransactionsByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByCustomer(customerId));
    }

    @GetMapping("/car/{carId}")
    public ResponseEntity<List<RentalTransaction>> getTransactionsByCar(@PathVariable UUID carId) {
        return ResponseEntity.ok(transactionService.getTransactionsByCar(carId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<RentalTransaction>> getTransactionsByStatus(@PathVariable TransactionStatus status) {
        return ResponseEntity.ok(transactionService.getTransactionsByStatus(status));
    }
}