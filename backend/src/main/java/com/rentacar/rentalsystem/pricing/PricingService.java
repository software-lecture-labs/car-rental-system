package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PricingService {

    private final PricingPolicyRepository policyRepository;

    public void updateDiscountRate(String policyName, BigDecimal newRate) {
        PricingPolicy policy = policyRepository.findByPolicyNameIgnoreCase(policyName)
                .orElseThrow(() -> new ResourceNotFoundException("Pricing policy not found: " + policyName));

        if (newRate == null || newRate.compareTo(BigDecimal.ZERO) < 0 || newRate.compareTo(BigDecimal.ONE) >= 0) {
            throw new InvalidRequestException("Discount rate must be greater than or equal to 0 and less than 1.");
        }

        policy.setDiscountRate(newRate);
        policyRepository.save(policy);
    }

    public List<PricingPolicy> getAllPricingPolicies() {
        return policyRepository.findAll();
    }

    public PriceQuote quote(Car car, long rentalDays) {
        int days = (int) Math.min(rentalDays, Integer.MAX_VALUE);
        Optional<PricingPolicy> bestPolicy = policyRepository.findFirstByMinDaysLessThanEqualOrderByMinDaysDesc(days);

        if (bestPolicy.isEmpty()) {
            BigDecimal amount = new StandardPricingStrategy().calculatePrice(car, rentalDays);
            return new PriceQuote(BigDecimal.ZERO, roundMoney(amount));
        }

        PricingPolicy policy = bestPolicy.get();
        BigDecimal amount = new DiscountPricingStrategy(policy).calculatePrice(car, rentalDays);
        return new PriceQuote(policy.getDiscountRate(), roundMoney(amount));
    }

    public static BigDecimal roundMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
