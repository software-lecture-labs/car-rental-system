package com.rentacar.rentalsystem.rental;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record RentalResponse(
        UUID id,
        UUID carId,
        String carPlate,
        String carBrand,
        String carModel,
        UUID customerId,
        String customerFullName,
        LocalDateTime rentalStart,
        LocalDateTime rentalEnd,
        LocalDateTime transactionDate,
        BigDecimal dailyPrice,
        BigDecimal discountRate,
        BigDecimal totalAmount,
        BigDecimal depositAmount,
        BigDecimal refundedAmount,
        LocalDateTime pickedUpAt,
        TransactionStatus status
) {

    public static RentalResponse from(RentalTransaction transaction) {
        var car = transaction.getCar();
        var customer = transaction.getCustomer();
        return new RentalResponse(
                transaction.getId(),
                car.getId(),
                car.getPlate(),
                car.getBrand(),
                car.getModel(),
                customer.getId(),
                customer.getFirstName() + " " + customer.getLastName(),
                transaction.getRentalStart(),
                transaction.getRentalEnd(),
                transaction.getTransactionDate(),
                transaction.getDailyPrice(),
                transaction.getDiscountRate(),
                transaction.getTotalAmount(),
                transaction.getDepositAmount(),
                transaction.getRefundedAmount(),
                transaction.getPickedUpAt(),
                transaction.getStatus()
        );
    }
}
