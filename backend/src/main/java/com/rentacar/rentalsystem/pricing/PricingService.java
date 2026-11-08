package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PricingService {


    public static final String DAILY_PACKAGE = "DAILY";

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

    public BigDecimal calculatePrice(Car car, String selectedPackage, long rentalDays) {

        if (selectedPackage == null || selectedPackage.isBlank() || selectedPackage.equalsIgnoreCase(DAILY_PACKAGE)) {
            return new StandardPricingStrategy().calculatePrice(car, rentalDays);
        }

        PricingPolicy policy = policyRepository.findByPolicyNameIgnoreCase(selectedPackage)
                .orElseThrow(() -> new InvalidRequestException("Unknown pricing package: " + selectedPackage));

        if (rentalDays >= policy.getMinDays()) {
            return new DiscountPricingStrategy(policy).calculatePrice(car, rentalDays);
        } else {
            throw new InvalidRequestException("The " + policy.getPolicyName() + " package requires at least "
                    + policy.getMinDays() + " rental days.");
        }
    }
}
