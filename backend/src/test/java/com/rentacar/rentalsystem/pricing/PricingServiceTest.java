package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PricingServiceTest {

    private PricingPolicyRepository repository;
    private PricingService service;
    private Car car;

    @BeforeEach
    void setUp() {
        repository = mock(PricingPolicyRepository.class);
        service = new PricingService(repository);

        car = new Car();
        car.setDailyBasePrice(new BigDecimal("1333.33"));

        PricingPolicy weekly = new PricingPolicy();
        weekly.setPolicyName("WEEKLY");
        weekly.setMinDays(7);
        weekly.setDiscountRate(new BigDecimal("0.1000"));
        when(repository.findByPolicyNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(repository.findByPolicyNameIgnoreCase("weekly")).thenReturn(Optional.of(weekly));
    }

    @Test
    void dailyPackageHasNoDiscount() {
        PriceQuote quote = service.quote(car, "DAILY", 3);

        assertThat(quote.discountRate()).isEqualByComparingTo("0");
        assertThat(quote.totalAmount()).isEqualByComparingTo("3999.99");
    }

    @Test
    void noPackageMeansDailyPrice() {
        assertThat(service.quote(car, null, 1).totalAmount()).isEqualByComparingTo("1333.33");
    }

    @Test
    void weeklyPackageAppliesDiscountAndRoundsToTwoDecimals() {
        PriceQuote quote = service.quote(car, "weekly", 8);

        assertThat(quote.discountRate()).isEqualByComparingTo("0.1000");
        assertThat(quote.totalAmount()).isEqualByComparingTo("9599.98");
        assertThat(quote.totalAmount().scale()).isEqualTo(2);
    }

    @Test
    void tooFewDaysForPackageIsRejected() {
        assertThatThrownBy(() -> service.quote(car, "weekly", 3))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("at least 7");
    }

    @Test
    void unknownPackageIsRejected() {
        assertThatThrownBy(() -> service.quote(car, "YEARLY", 30))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("Unknown pricing package");
    }
}
