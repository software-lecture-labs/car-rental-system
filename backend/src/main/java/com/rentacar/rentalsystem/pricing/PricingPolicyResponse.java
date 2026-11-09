package com.rentacar.rentalsystem.pricing;

import java.math.BigDecimal;
import java.util.UUID;

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
