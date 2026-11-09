package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.car.Car;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
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
    }

    @Test
    void shortRentalWithoutMatchingTierHasNoDiscount() {
        when(repository.findFirstByMinDaysLessThanEqualOrderByMinDaysDesc(anyInt())).thenReturn(Optional.empty());

        PriceQuote quote = service.quote(car, 3);

        assertThat(quote.discountRate()).isEqualByComparingTo("0");
        assertThat(quote.totalAmount()).isEqualByComparingTo("3999.99");
    }

    @Test
    void standardTierKeepsDailyPrice() {
        when(repository.findFirstByMinDaysLessThanEqualOrderByMinDaysDesc(1)).thenReturn(Optional.of(policy("STANDARD", 1, "0")));

        assertThat(service.quote(car, 1).totalAmount()).isEqualByComparingTo("1333.33");
    }

    @Test
    void bestTierForDayCountIsAppliedAutomaticallyAndRoundedToTwoDecimals() {
        when(repository.findFirstByMinDaysLessThanEqualOrderByMinDaysDesc(8)).thenReturn(Optional.of(policy("WEEKLY", 7, "0.1000")));

        PriceQuote quote = service.quote(car, 8);

        assertThat(quote.discountRate()).isEqualByComparingTo("0.1000");
        assertThat(quote.totalAmount()).isEqualByComparingTo("9599.98");
        assertThat(quote.totalAmount().scale()).isEqualTo(2);
    }

    @Test
    void monthlyTierIsUsedForThirtyDays() {
        when(repository.findFirstByMinDaysLessThanEqualOrderByMinDaysDesc(30)).thenReturn(Optional.of(policy("MONTHLY", 30, "0.2000")));
        car.setDailyBasePrice(new BigDecimal("1000.00"));

        PriceQuote quote = service.quote(car, 30);

        assertThat(quote.discountRate()).isEqualByComparingTo("0.2000");
        assertThat(quote.totalAmount()).isEqualByComparingTo("24000.00");
    }

    private static PricingPolicy policy(String name, int minDays, String rate) {
        PricingPolicy policy = new PricingPolicy();
        policy.setPolicyName(name);
        policy.setMinDays(minDays);
        policy.setDiscountRate(new BigDecimal(rate));
        return policy;
    }
}
