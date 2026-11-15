package com.rentacar.rentalsystem.car;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Admin'in değiştirebileceği araç bilgileri.
 * Plaka (aracın kimliği) ve durum (bakım/kirada) bu istekle değişmez; durum kendi endpoint'lerinden değişir.
 * Günlük fiyat değişikliği mevcut kiralamaları etkilemez, kiralama fiyatın o anki kopyasını saklar.
 */
public record CarUpdateRequest(

        @NotBlank @Size(max = 50)
        String brand,

        @NotBlank @Size(max = 50)
        String model,

        @NotNull @Min(1950) @Max(2100)
        Integer productionYear,

        @NotNull
        FuelType fuelType,

        @NotNull
        TransmissionType transmission,

        @NotBlank @Size(max = 30)
        String color,

        @NotNull @Min(1) @Max(20)
        Integer seatCount,

        @NotNull @DecimalMin(value = "0.0", inclusive = false) @Digits(integer = 8, fraction = 2)
        BigDecimal dailyBasePrice
) {

    void applyTo(Car car) {
        car.setBrand(brand.trim());
        car.setModel(model.trim());
        car.setProductionYear(productionYear);
        car.setFuelType(fuelType);
        car.setTransmission(transmission);
        car.setColor(color.trim());
        car.setSeatCount(seatCount);
        car.setDailyBasePrice(dailyBasePrice);
    }
}
