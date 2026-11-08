package com.rentacar.rentalsystem.rental;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class RentalTransactionTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 12, 1, 10, 0);

    @Test
    void calculateTotalUsesSnapshotPriceDaysAndDiscount() {
        RentalTransaction rental = rental(START.plusDays(7), "1250.00", "0.1000");

        assertThat(rental.getRentalDays()).isEqualTo(7);
        assertThat(rental.calculateTotal()).isEqualByComparingTo("7875.00");
    }

    @Test
    void startedDayCountsAsFullDay() {
        RentalTransaction rental = rental(START.plusDays(2).plusHours(3), "1000.00", "0");

        assertThat(rental.getRentalDays()).isEqualTo(3);
        assertThat(rental.calculateTotal()).isEqualByComparingTo("3000.00");
    }

    private static RentalTransaction rental(LocalDateTime end, String dailyPrice, String discountRate) {
        RentalTransaction rental = new RentalTransaction();
        rental.setRentalStart(START);
        rental.setRentalEnd(end);
        rental.setDailyPrice(new BigDecimal(dailyPrice));
        rental.setDiscountRate(new BigDecimal(discountRate));
        return rental;
    }
}
