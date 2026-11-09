package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.car.Car;
import java.math.BigDecimal;

public class DiscountPricingStrategy implements PricingStrategy {

    private final PricingPolicy policy;

    public DiscountPricingStrategy(PricingPolicy policy) {
        this.policy = policy;
    }

    @Override
    public BigDecimal calculatePrice(Car car, long rentalDays) {
        BigDecimal baseTotal = car.getDailyBasePrice().multiply(BigDecimal.valueOf(rentalDays));

        BigDecimal discountMultiplier = BigDecimal.ONE.subtract(policy.getDiscountRate());

        return baseTotal.multiply(discountMultiplier);
    }
}