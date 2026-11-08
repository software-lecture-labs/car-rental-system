package com.rentacar.rentalsystem.car;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Locale;

public record CarRequest(

        @NotBlank @Size(max = 50)
        String brand,

        @NotBlank @Size(max = 50)
        String model,

        @Min(1950) @Max(2100)
        int productionYear,

        @NotNull
        FuelType fuelType,

        @NotNull
        TransmissionType transmission,

        @NotBlank @Size(max = 30)
        String color,

        @NotBlank
        @Pattern(regexp = "^\\s*[0-9]{2}\\s*[A-Za-z]{1,3}\\s*[0-9]{2,4}\\s*$",
                message = "must be a valid Turkish plate, e.g. 34ABC123")
        String plate,

        @Min(1) @Max(20)
        int seatCount,

        @NotNull @DecimalMin(value = "0.0", inclusive = false) @Digits(integer = 8, fraction = 2)
        BigDecimal dailyBasePrice
) {

    public Car toEntity() {
        Car car = new Car();
        car.setBrand(brand.trim());
        car.setModel(model.trim());
        car.setProductionYear(productionYear);
        car.setFuelType(fuelType);
        car.setTransmission(transmission);
        car.setColor(color.trim());
        car.setPlate(normalizePlate(plate));
        car.setSeatCount(seatCount);
        car.setDailyBasePrice(dailyBasePrice);
        return car;
    }

    static String normalizePlate(String plate) {
        return plate.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
    }
}
