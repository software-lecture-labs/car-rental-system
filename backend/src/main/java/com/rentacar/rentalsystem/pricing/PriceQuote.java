package com.rentacar.rentalsystem.pricing;

import java.math.BigDecimal;

public record PriceQuote(BigDecimal discountRate, BigDecimal totalAmount) {

    private static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.20");

    public BigDecimal depositAmount() {
        return PricingService.roundMoney(totalAmount.multiply(DEPOSIT_RATE));
    }

    public BigDecimal amountDueAtPickup() {
        return totalAmount.subtract(depositAmount());
    }
}
