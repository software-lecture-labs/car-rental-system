package com.rentacar.rentalsystem.rental;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * car and customer are LAZY on the entity. With open-in-view disabled they cannot be loaded later
 * in the controller, so read queries fetch them together with the rental (@EntityGraph).
 */
public interface RentalTransactionRepository extends JpaRepository<RentalTransaction, UUID> {

    @Override
    @EntityGraph(attributePaths = {"car", "customer"})
    List<RentalTransaction> findAll();

    @Override
    @EntityGraph(attributePaths = {"car", "customer"})
    Optional<RentalTransaction> findById(UUID id);

    @EntityGraph(attributePaths = {"car", "customer"})
    List<RentalTransaction> findByCustomer_Id(UUID customerId);

    @EntityGraph(attributePaths = {"car", "customer"})
    List<RentalTransaction> findByCar_Id(UUID carId);

    @EntityGraph(attributePaths = {"car", "customer"})
    List<RentalTransaction> findByStatus(TransactionStatus status);
}
