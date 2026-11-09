package com.rentacar.rentalsystem.rental;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
public class RentalTransactionController {

    private final RentalTransactionService transactionService;

    @PreAuthorize("hasRole('ADMIN') or #request.customerId().toString() == authentication.name")
    @PostMapping
    public ResponseEntity<RentalResponse> rentCar(@Valid @RequestBody RentalRequest request) {
        RentalTransaction transaction = transactionService.rentCar(
                request.customerId(),
                request.carId(),
                request.startDate(),
                request.rentalDays()
        );
        return new ResponseEntity<>(RentalResponse.from(transaction), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/pickup")
    public ResponseEntity<String> pickupCar(@PathVariable UUID id) {
        transactionService.pickupCar(id);
        return ResponseEntity.ok("Car has been picked up.");
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<String> returnCar(@PathVariable UUID id) {
        transactionService.returnCar(id);
        return ResponseEntity.ok("Car has been returned and the rental is completed.");
    }

    @PreAuthorize("hasRole('ADMIN') or @rentalAccess.isOwner(#id, authentication)")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<RentalResponse> cancelReservation(@PathVariable UUID id) {
        return ResponseEntity.ok(RentalResponse.from(transactionService.cancelReservation(id)));
    }

    @PutMapping("/{id}/rollback")
    public ResponseEntity<RentalResponse> rollBackRental(@PathVariable UUID id, @Valid @RequestBody RollbackRequest request) {
        RentalTransaction result = transactionService.rollBackRental(
                id, request.reason(), request.resolution(), request.replacementCarId());
        return ResponseEntity.ok(RentalResponse.from(result));
    }

    @PreAuthorize("hasRole('ADMIN') or @rentalAccess.isOwner(#id, authentication)")
    @GetMapping("/{id}")
    public ResponseEntity<RentalResponse> getTransactionById(@PathVariable UUID id) {
        return ResponseEntity.ok(RentalResponse.from(transactionService.getTransactionById(id)));
    }

    @GetMapping
    public ResponseEntity<List<RentalResponse>> getAllTransactions() {
        return ResponseEntity.ok(toResponses(transactionService.getAllTransactions()));
    }

    @PreAuthorize("hasRole('ADMIN') or #customerId.toString() == authentication.name")
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<RentalResponse>> getTransactionsByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(toResponses(transactionService.getTransactionsByCustomer(customerId)));
    }

    @GetMapping("/car/{carId}")
    public ResponseEntity<List<RentalResponse>> getTransactionsByCar(@PathVariable UUID carId) {
        return ResponseEntity.ok(toResponses(transactionService.getTransactionsByCar(carId)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<RentalResponse>> getTransactionsByStatus(@PathVariable TransactionStatus status) {
        return ResponseEntity.ok(toResponses(transactionService.getTransactionsByStatus(status)));
    }

    private static List<RentalResponse> toResponses(List<RentalTransaction> transactions) {
        return transactions.stream().map(RentalResponse::from).toList();
    }
}