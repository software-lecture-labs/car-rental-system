package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.car.CarStatus;
import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.pricing.PriceQuote;
import com.rentacar.rentalsystem.pricing.PricingService;
import com.rentacar.rentalsystem.user.Customer;
import com.rentacar.rentalsystem.user.CustomerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RentalTransactionServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 12, 1, 9, 0);

    private RentalTransactionRepository repository;
    private CarService carService;
    private CustomerService customerService;
    private PricingService pricingService;
    private RentalTransactionService service;

    private Car car;
    private Customer customer;

    @BeforeEach
    void setUp() {
        repository = mock(RentalTransactionRepository.class);
        carService = mock(CarService.class);
        customerService = mock(CustomerService.class);
        pricingService = mock(PricingService.class);
        Clock clock = Clock.fixed(NOW.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        service = new RentalTransactionService(repository, carService, customerService, pricingService, clock);

        car = new Car();
        car.setId(UUID.randomUUID());
        car.setDailyBasePrice(new BigDecimal("1250.00"));
        car.setStatus(CarStatus.AVAILABLE);

        customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setBalance(new BigDecimal("10000.00"));

        when(carService.getCarById(car.getId())).thenReturn(car);
        when(customerService.getCustomerById(customer.getId())).thenReturn(customer);
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void reservationChargesCustomerButKeepsCarAvailable() {
        when(pricingService.quote(car, "WEEKLY", 7))
                .thenReturn(new PriceQuote(new BigDecimal("0.1000"), new BigDecimal("7875.00")));

        RentalTransaction rental = service.rentCar(customer.getId(), car.getId(), "WEEKLY", NOW.plusDays(5), 7);

        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
        assertThat(customer.getBalance()).isEqualByComparingTo("2125.00");
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(rental.getDiscountRate()).isEqualByComparingTo("0.1000");
        assertThat(rental.getTotalAmount()).isEqualByComparingTo("7875.00");
        assertThat(rental.getRentalEnd()).isEqualTo(NOW.plusDays(12));
        assertThat(rental.calculateTotal()).isEqualByComparingTo(rental.getTotalAmount());
    }

    @Test
    void rentedCarCanStillBeReservedForLaterDates() {
        car.setStatus(CarStatus.RENTED);
        when(pricingService.quote(car, null, 3))
                .thenReturn(new PriceQuote(BigDecimal.ZERO, new BigDecimal("3750.00")));

        RentalTransaction rental = service.rentCar(customer.getId(), car.getId(), null, NOW.plusDays(20), 3);

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
    }

    @Test
    void carUnderMaintenanceCannotBeReserved() {
        car.setStatus(CarStatus.MAINTENANCE);

        assertThatThrownBy(() -> service.rentCar(customer.getId(), car.getId(), null, NOW.plusDays(1), 3))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("maintenance");
        verify(repository, never()).save(any());
    }

    @Test
    void overlappingDatesAreRejectedAndCustomerIsNotCharged() {
        when(repository.existsByCar_IdAndStatusInAndRentalStartLessThanAndRentalEndGreaterThan(
                eq(car.getId()), anyCollection(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> service.rentCar(customer.getId(), car.getId(), null, NOW.plusDays(1), 3))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already booked");
        assertThat(customer.getBalance()).isEqualByComparingTo("10000.00");
        verify(repository, never()).save(any());
    }

    @Test
    void insufficientBalanceIsRejected() {
        when(pricingService.quote(any(), any(), anyLong()))
                .thenReturn(new PriceQuote(BigDecimal.ZERO, new BigDecimal("50000.00")));

        assertThatThrownBy(() -> service.rentCar(customer.getId(), car.getId(), null, NOW.plusDays(1), 40))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Insufficient balance");
        verify(repository, never()).save(any());
    }

    @Test
    void pickupBeforeStartDateIsRejected() {
        RentalTransaction rental = pendingRental(NOW.plusDays(2));

        assertThatThrownBy(() -> service.pickupCar(rental.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("start date");
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void pickupOnStartDayMarksCarRented() {
        RentalTransaction rental = pendingRental(NOW.withHour(14));

        service.pickupCar(rental.getId());

        assertThat(car.getStatus()).isEqualTo(CarStatus.RENTED);
    }

    @Test
    void pickupIsRejectedWhilePreviousRentalIsNotReturned() {
        RentalTransaction rental = pendingRental(NOW.minusHours(1));
        car.setStatus(CarStatus.RENTED);

        assertThatThrownBy(() -> service.pickupCar(rental.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not been returned");
    }

    @Test
    void returnWithoutPickupIsRejected() {
        RentalTransaction rental = pendingRental(NOW.minusHours(1));

        assertThatThrownBy(() -> service.returnCar(rental.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not been picked up");
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
    }

    @Test
    void returnAfterPickupCompletesRentalAndFreesCar() {
        RentalTransaction rental = pendingRental(NOW.minusDays(3));
        car.setStatus(CarStatus.RENTED);

        service.returnCar(rental.getId());

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void completedRentalCannotBeReturnedAgain() {
        RentalTransaction rental = pendingRental(NOW.minusDays(3));
        rental.complete();

        assertThatThrownBy(() -> service.returnCar(rental.getId()))
                .isInstanceOf(BusinessRuleException.class);
    }

    private RentalTransaction pendingRental(LocalDateTime start) {
        RentalTransaction rental = new RentalTransaction();
        rental.setId(UUID.randomUUID());
        rental.setCar(car);
        rental.setCustomer(customer);
        rental.setRentalStart(start);
        rental.setRentalEnd(start.plusDays(3));
        rental.setDailyPrice(car.getDailyBasePrice());
        rental.setTotalAmount(new BigDecimal("3750.00"));
        rental.setStatus(TransactionStatus.PENDING);

        when(repository.findById(rental.getId())).thenReturn(Optional.of(rental));
        when(repository.findFirstByCar_IdAndStatusOrderByRentalStartAsc(car.getId(), TransactionStatus.PENDING))
                .thenReturn(Optional.of(rental));
        return rental;
    }
}
