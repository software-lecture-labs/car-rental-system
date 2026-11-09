package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.car.CarStatus;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import com.rentacar.rentalsystem.pricing.PriceQuote;
import com.rentacar.rentalsystem.pricing.PricingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CarAvailabilityServiceTest {

    private static final LocalDateTime START = LocalDateTime.of(2026, 12, 20, 10, 0);

    private CarService carService;
    private RentalTransactionRepository repository;
    private CarAvailabilityService service;

    private Car clio;
    private Car tesla;
    private Car egea;

    @BeforeEach
    void setUp() {
        carService = mock(CarService.class);
        repository = mock(RentalTransactionRepository.class);
        PricingService pricingService = mock(PricingService.class);
        service = new CarAvailabilityService(carService, pricingService, repository);

        clio = car("Renault", "Clio", "1250.00");
        tesla = car("Tesla", "Model Y", "3500.00");
        egea = car("Fiat", "Egea", "1400.00");

        when(carService.getCarsNotInMaintenance()).thenReturn(List.of(tesla, clio, egea));
        when(repository.findBookedCarIds(TransactionStatus.CAR_BLOCKING_STATUSES, START, START.plusDays(5)))
                .thenReturn(Set.of());
        when(pricingService.quote(any(), anyLong())).thenAnswer(invocation -> {
            Car car = invocation.getArgument(0);
            long days = invocation.getArgument(1);
            return new PriceQuote(BigDecimal.ZERO, car.getDailyBasePrice().multiply(BigDecimal.valueOf(days)));
        });
    }

    @Test
    void returnsFreeCarsWithPriceSortedFromCheapest() {
        List<AvailableCarResponse> offers = service.findAvailableCars(START, 5, null);

        assertThat(offers).extracting(offer -> offer.car().model()).containsExactly("Clio", "Egea", "Model Y");
        AvailableCarResponse clioOffer = offers.getFirst();
        assertThat(clioOffer.rentalDays()).isEqualTo(5);
        assertThat(clioOffer.totalAmount()).isEqualByComparingTo("6250.00");
        assertThat(clioOffer.depositAmount()).isEqualByComparingTo("1250.00");
        assertThat(clioOffer.amountDueAtPickup()).isEqualByComparingTo("5000.00");
    }

    @Test
    void canSortFromMostExpensive() {
        List<AvailableCarResponse> offers = service.findAvailableCars(START, 5, "price,desc");

        assertThat(offers).extracting(offer -> offer.car().model()).containsExactly("Model Y", "Egea", "Clio");
    }

    @Test
    void carsBookedForTheseDatesAreLeftOut() {
        when(repository.findBookedCarIds(TransactionStatus.CAR_BLOCKING_STATUSES, START, START.plusDays(5)))
                .thenReturn(Set.of(clio.getId()));

        List<AvailableCarResponse> offers = service.findAvailableCars(START, 5, "price,asc");

        assertThat(offers).extracting(offer -> offer.car().model()).containsExactly("Egea", "Model Y");
    }

    @Test
    void unknownSortIsRejected() {
        assertThatThrownBy(() -> service.findAvailableCars(START, 5, "brand"))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("price,asc");
    }

    private static Car car(String brand, String model, String dailyPrice) {
        Car car = new Car();
        car.setId(UUID.randomUUID());
        car.setBrand(brand);
        car.setModel(model);
        car.setDailyBasePrice(new BigDecimal(dailyPrice));
        car.setStatus(CarStatus.AVAILABLE);
        return car;
    }
}
