package com.rentacar.rentalsystem.pricing;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/policies")
    public ResponseEntity<List<PricingPolicy>> getAllPolicies() {
        return ResponseEntity.ok(pricingService.getAllPricingPolicies());
    }

    // PUT: http://localhost:8081/api/pricing/policies/WEEKLY?rate=0.08  (codes: STANDARD, WEEKLY, MONTHLY)
    @PutMapping("/policies/{policyName}")
    public ResponseEntity<String> updateDiscountRate(
            @PathVariable String policyName,
            @RequestParam BigDecimal rate) {

        pricingService.updateDiscountRate(policyName, rate);
        return ResponseEntity.ok("Discount rate updated for package " + policyName + ".");
    }
}