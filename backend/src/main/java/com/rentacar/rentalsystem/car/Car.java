package com.rentacar.rentalsystem.car;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "cars")
@Getter
@Setter
@NoArgsConstructor
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50)
    private String brand;

    @Column(nullable = false, length = 50)
    private String model;

    @Column(nullable = false)
    private int productionYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FuelType fuelType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransmissionType transmission;

    @Column(nullable = false, length = 30)
    private String color;

    @Column(nullable = false, unique = true, length = 10)
    private String plate;

    @Column(nullable = false)
    private int seatCount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyBasePrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CarStatus status = CarStatus.AVAILABLE;


    public void markAsRented() {
        this.status = CarStatus.RENTED;
    }

    public void markAsAvailable() {
        this.status = CarStatus.AVAILABLE;
    }

    public void markAsMaintenance() {
        this.status = CarStatus.MAINTENANCE;
    }
}
