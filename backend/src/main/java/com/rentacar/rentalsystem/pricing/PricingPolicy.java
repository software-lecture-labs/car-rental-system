package com.rentacar.rentalsystem.pricing;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "pricing_policies")
@Getter
@Setter
@NoArgsConstructor
public class PricingPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String policyName;

    @Column(nullable = false, unique = true)
    private int minDays;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal discountRate;
}