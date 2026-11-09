package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.car.CarResponse;
import com.rentacar.rentalsystem.pricing.PriceQuote;

import java.math.BigDecimal;

public record AvailableCarResponse(
        CarResponse car,
        long rentalDays,
        BigDecimal discountRate,
        BigDecimal totalAmount,
        BigDecimal depositAmount,
        BigDecimal amountDueAtPickup
) {

    public static AvailableCarResponse from(Car car, long rentalDays, PriceQuote quote) {
        return new AvailableCarResponse(
                CarResponse.from(car),
                rentalDays,
                quote.discountRate(),
                quote.totalAmount(),
                quote.depositAmount(),
                quote.amountDueAtPickup()
        );
    }
}
