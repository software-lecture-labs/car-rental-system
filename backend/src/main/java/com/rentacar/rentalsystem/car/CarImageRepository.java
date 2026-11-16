package com.rentacar.rentalsystem.car;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CarImageRepository extends JpaRepository<CarImage, UUID> {

    /** Kapak (en küçük sort_order) başta olacak şekilde, dosya içeriği olmadan. */
    List<CarImageSummary> findByCar_IdOrderBySortOrderAsc(UUID carId);

    Optional<CarImage> findByIdAndCar_Id(UUID id, UUID carId);

    Optional<CarImage> findFirstByCar_IdOrderBySortOrderAsc(UUID carId);

    long countByCar_Id(UUID carId);

    @Query("select max(i.sortOrder) from CarImage i where i.car.id = :carId")
    Optional<Integer> findMaxSortOrder(@Param("carId") UUID carId);

    @Query("select min(i.sortOrder) from CarImage i where i.car.id = :carId")
    Optional<Integer> findMinSortOrder(@Param("carId") UUID carId);
}
