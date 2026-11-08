package com.rentacar.rentalsystem.pricing;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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
    public ResponseEntity<List<PricingPolicyResponse>> getAllPolicies() {
        return ResponseEntity.ok(pricingService.getAllPricingPolicies().stream()
                .map(PricingPolicyResponse::from)
                .toList());
    }

    @PutMapping("/policies/{policyName}")
    public ResponseEntity<String> updateDiscountRate(
            @PathVariable String policyName,
            @RequestParam @DecimalMin("0.0") @DecimalMax(value = "1.0", inclusive = false) BigDecimal rate) {

        pricingService.updateDiscountRate(policyName, rate);
        return ResponseEntity.ok("Discount rate updated for package " + policyName + ".");
    }
}
