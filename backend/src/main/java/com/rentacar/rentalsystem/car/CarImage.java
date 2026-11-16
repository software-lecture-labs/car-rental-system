package com.rentacar.rentalsystem.car;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bir araca ait tek bir görsel. Dosyanın kendisi data alanında (BYTEA) durur.
 * Not: data alanına @Lob KONMAZ; PostgreSQL'de @Lob byte[] "oid" tipine eşlenir, bizim kolonumuz bytea.
 */
@Entity
@Table(name = "car_images")
@Getter
@Setter
@NoArgsConstructor
public class CarImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Column(nullable = false, length = 50)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @Column(nullable = false)
    private int sizeBytes;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
