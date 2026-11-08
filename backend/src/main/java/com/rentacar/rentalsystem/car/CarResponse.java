package com.rentacar.rentalsystem.car;

import java.math.BigDecimal;
import java.util.UUID;

public record CarResponse(
        UUID id,
        String brand,
        String model,
        int productionYear,
        FuelType fuelType,
        TransmissionType transmission,
        String color,
        String plate,
        int seatCount,
        BigDecimal dailyBasePrice,
        CarStatus status
) {

    public static CarResponse from(Car car) {
        return new CarResponse(
                car.getId(),
                car.getBrand(),
                car.getModel(),
                car.getProductionYear(),
                car.getFuelType(),
                car.getTransmission(),
                car.getColor(),
                car.getPlate(),
                car.getSeatCount(),
                car.getDailyBasePrice(),
                car.getStatus()
        );
    }
}
