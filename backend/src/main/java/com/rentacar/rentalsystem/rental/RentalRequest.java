package com.rentacar.rentalsystem.rental;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Payload for renting a car.
 * selectedPackage is optional: empty or "DAILY" means no discount, otherwise a pricing policy code (e.g. WEEKLY).
 */
public record RentalRequest(

        @NotNull
        UUID customerId,

        @NotNull
        UUID carId,

        @Size(max = 100)
        String selectedPackage,

        @NotNull @FutureOrPresent
        LocalDateTime startDate,

        @Min(1)
        long rentalDays
) {
}
