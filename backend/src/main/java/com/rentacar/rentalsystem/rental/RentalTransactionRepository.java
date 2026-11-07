package com.rentacar.rentalsystem.rental;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RentalTransactionRepository extends JpaRepository<RentalTransaction, UUID> {

    List<RentalTransaction> findByCustomer_Id(UUID customerId);

    List<RentalTransaction> findByCar_Id(UUID carId);

    List<RentalTransaction> findByStatus(TransactionStatus status);
}