package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import com.rentacar.rentalsystem.pricing.PricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CarAvailabilityService {

    public static final String SORT_PRICE_ASC = "price,asc";
    public static final String SORT_PRICE_DESC = "price,desc";

    private final CarService carService;
    private final PricingService pricingService;
    private final RentalTransactionRepository transactionRepository;

    public List<AvailableCarResponse> findAvailableCars(LocalDateTime start, long rentalDays, String sort) {
        Comparator<AvailableCarResponse> byPrice = priceComparator(sort);
        LocalDateTime end = start.plusDays(rentalDays);
        Set<UUID> bookedCarIds = transactionRepository.findBookedCarIds(
                TransactionStatus.CAR_BLOCKING_STATUSES, start, end);

        return carService.getCarsNotInMaintenance().stream()
                .filter(car -> !bookedCarIds.contains(car.getId()))
                .map(car -> AvailableCarResponse.from(car, rentalDays, pricingService.quote(car, rentalDays)))
                .sorted(byPrice.thenComparing(offer -> offer.car().brand())
                        .thenComparing(offer -> offer.car().model()))
                .toList();
    }

    private static Comparator<AvailableCarResponse> priceComparator(String sort) {
        Comparator<AvailableCarResponse> ascending = Comparator.comparing(AvailableCarResponse::totalAmount);
        if (sort == null || sort.isBlank() || sort.equalsIgnoreCase(SORT_PRICE_ASC)) {
            return ascending;
        }
        if (sort.equalsIgnoreCase(SORT_PRICE_DESC)) {
            return ascending.reversed();
        }
        throw new InvalidRequestException("Sort must be '" + SORT_PRICE_ASC + "' or '" + SORT_PRICE_DESC + "'.");
    }
}
