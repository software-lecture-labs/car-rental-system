package com.rentacar.rentalsystem.rental;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RollbackRequest(

        @NotNull
        CancellationReason reason,

        BreakdownResolution resolution,

        UUID replacementCarId
) {
}
