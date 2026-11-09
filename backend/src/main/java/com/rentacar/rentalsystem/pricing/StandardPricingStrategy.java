package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.car.Car;
import java.math.BigDecimal;

public class StandardPricingStrategy implements PricingStrategy {

    @Override
    public BigDecimal calculatePrice(Car car, long rentalDays) {
        return car.getDailyBasePrice().multiply(BigDecimal.valueOf(rentalDays));
    }
}