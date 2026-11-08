package com.rentacar.rentalsystem.pricing;

import java.math.BigDecimal;

public record PriceQuote(BigDecimal discountRate, BigDecimal totalAmount) {
}
