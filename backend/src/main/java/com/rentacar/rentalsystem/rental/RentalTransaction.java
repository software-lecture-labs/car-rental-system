package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.user.Customer;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "rental_transactions")
@Getter
@Setter
@NoArgsConstructor
public class RentalTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private LocalDateTime rentalStart;

    @Column(nullable = false)
    private LocalDateTime rentalEnd;

    @Column(nullable = false)
    private LocalDateTime transactionDate = LocalDateTime.now();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyPrice;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal discountRate = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal refundedAmount = BigDecimal.ZERO;

    private LocalDateTime pickedUpAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status = TransactionStatus.PENDING;

    public boolean isPickedUp() {
        return pickedUpAt != null;
    }

    public BigDecimal getRemainingAmount() {
        return totalAmount.subtract(depositAmount);
    }

    public long getRentalDays() {
        long hours = Duration.between(rentalStart, rentalEnd).toHours();
        return Math.max(1, (hours + 23) / 24);
    }

    public BigDecimal calculateTotal() {
        BigDecimal base = dailyPrice.multiply(BigDecimal.valueOf(getRentalDays()));
        return base.multiply(BigDecimal.ONE.subtract(discountRate)).setScale(2, RoundingMode.HALF_UP);
    }

    public void complete() {
        this.status = TransactionStatus.COMPLETED;
    }

    public void cancel() {
        this.status = TransactionStatus.CANCELLED;
    }

    public void rollBack() {
        this.status = TransactionStatus.ROLLED_BACK;
    }
}