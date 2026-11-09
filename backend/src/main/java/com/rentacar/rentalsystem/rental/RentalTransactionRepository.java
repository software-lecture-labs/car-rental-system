package com.rentacar.rentalsystem.rental;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

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

    boolean existsByCar_IdAndStatusInAndRentalStartLessThanAndRentalEndGreaterThan(
            UUID carId, Collection<TransactionStatus> statuses, LocalDateTime end, LocalDateTime start);

    Optional<RentalTransaction> findFirstByCar_IdAndStatusOrderByRentalStartAsc(UUID carId, TransactionStatus status);

    @Query("""
            select distinct r.car.id from RentalTransaction r
            where r.status in :statuses and r.rentalStart < :end and r.rentalEnd > :start
            """)
    Set<UUID> findBookedCarIds(Collection<TransactionStatus> statuses, LocalDateTime start, LocalDateTime end);

    List<RentalTransaction> findByStatusAndPickedUpAtIsNullAndRentalStartBefore(TransactionStatus status, LocalDateTime start);
}
