package com.rentacar.rentalsystem.pricing;

import java.math.BigDecimal;
import java.util.UUID;

/** Pricing policy returned by the API. discountRate is a ratio: 0.1000 = 10%. */
public record PricingPolicyResponse(
        UUID id,
        String policyName,
        int minDays,
        BigDecimal discountRate
) {

    public static PricingPolicyResponse from(PricingPolicy policy) {
        return new PricingPolicyResponse(
                policy.getId(),
                policy.getPolicyName(),
                policy.getMinDays(),
                policy.getDiscountRate()
        );
    }
}
