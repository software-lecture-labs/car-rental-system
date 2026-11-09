package com.rentacar.rentalsystem.rental;

import java.util.List;

public enum TransactionStatus {

    PENDING,
    COMPLETED,
    CANCELLED,
    ROLLED_BACK;

    public static final List<TransactionStatus> CAR_BLOCKING_STATUSES = List.of(PENDING, COMPLETED);
}
