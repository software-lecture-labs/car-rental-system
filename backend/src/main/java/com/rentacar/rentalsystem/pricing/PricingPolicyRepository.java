package com.rentacar.rentalsystem.pricing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface PricingPolicyRepository extends JpaRepository<PricingPolicy, UUID> {
    Optional<PricingPolicy> findByPolicyName(String policyName);

    Optional<PricingPolicy> findByPolicyNameIgnoreCase(String policyName);

    Optional<PricingPolicy> findFirstByMinDaysLessThanEqualOrderByMinDaysDesc(int rentalDays);
}