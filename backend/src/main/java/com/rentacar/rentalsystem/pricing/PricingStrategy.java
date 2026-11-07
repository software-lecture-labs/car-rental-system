package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.car.Car;
import java.math.BigDecimal;

public interface PricingStrategy {
    BigDecimal calculatePrice(Car car, long rentalDays);
}