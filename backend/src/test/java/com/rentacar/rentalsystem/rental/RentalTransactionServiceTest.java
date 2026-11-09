package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.car.CarStatus;
import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
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
import java.util.List;
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
    void reservationChargesOnlyTheDepositAndKeepsCarAvailable() {
        when(pricingService.quote(car, 7))
                .thenReturn(new PriceQuote(new BigDecimal("0.1000"), new BigDecimal("7875.00")));

        RentalTransaction rental = service.rentCar(customer.getId(), car.getId(), NOW.plusDays(5), 7);

        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
        assertThat(rental.getDepositAmount()).isEqualByComparingTo("1575.00");
        assertThat(rental.getRemainingAmount()).isEqualByComparingTo("6300.00");
        assertThat(customer.getBalance()).isEqualByComparingTo("8425.00");
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(rental.getDiscountRate()).isEqualByComparingTo("0.1000");
        assertThat(rental.getTotalAmount()).isEqualByComparingTo("7875.00");
        assertThat(rental.getRentalEnd()).isEqualTo(NOW.plusDays(12));
        assertThat(rental.calculateTotal()).isEqualByComparingTo(rental.getTotalAmount());
    }

    @Test
    void rentedCarCanStillBeReservedForLaterDates() {
        car.setStatus(CarStatus.RENTED);
        when(pricingService.quote(car, 3))
                .thenReturn(new PriceQuote(BigDecimal.ZERO, new BigDecimal("3750.00")));

        RentalTransaction rental = service.rentCar(customer.getId(), car.getId(), NOW.plusDays(20), 3);

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
    }

    @Test
    void carUnderMaintenanceCannotBeReserved() {
        car.setStatus(CarStatus.MAINTENANCE);

        assertThatThrownBy(() -> service.rentCar(customer.getId(), car.getId(), NOW.plusDays(1), 3))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("maintenance");
        verify(repository, never()).save(any());
    }

    @Test
    void overlappingDatesAreRejectedAndCustomerIsNotCharged() {
        when(repository.existsByCar_IdAndStatusInAndRentalStartLessThanAndRentalEndGreaterThan(
                eq(car.getId()), anyCollection(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> service.rentCar(customer.getId(), car.getId(), NOW.plusDays(1), 3))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already booked");
        assertThat(customer.getBalance()).isEqualByComparingTo("10000.00");
        verify(repository, never()).save(any());
    }

    @Test
    void balanceBelowDepositIsRejected() {
        when(pricingService.quote(any(), anyLong()))
                .thenReturn(new PriceQuote(BigDecimal.ZERO, new BigDecimal("60000.00")));

        assertThatThrownBy(() -> service.rentCar(customer.getId(), car.getId(), NOW.plusDays(1), 40))
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
    void pickupChargesRemainingAmountAndMarksCarRented() {
        RentalTransaction rental = pendingRental(NOW.withHour(14));

        service.pickupCar(rental.getId());

        assertThat(car.getStatus()).isEqualTo(CarStatus.RENTED);
        assertThat(rental.getPickedUpAt()).isEqualTo(NOW);
        assertThat(customer.getBalance()).isEqualByComparingTo("7000.00");
    }

    @Test
    void pickupWithInsufficientBalanceIsRejectedAndReservationIsKept() {
        RentalTransaction rental = pendingRental(NOW.minusHours(1));
        customer.setBalance(new BigDecimal("2000.00"));

        assertThatThrownBy(() -> service.pickupCar(rental.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Insufficient balance");
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
        assertThat(rental.isPickedUp()).isFalse();
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(customer.getBalance()).isEqualByComparingTo("2000.00");
    }

    @Test
    void pickupAfterNoShowDeadlineIsRejected() {
        RentalTransaction rental = pendingRental(NOW.minusHours(5));

        assertThatThrownBy(() -> service.pickupCar(rental.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("expired");
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
    void returnAtEndCompletesRentalAndFreesCar() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(3));

        service.returnCar(rental.getId());

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(rental.getRentalEnd()).isEqualTo(NOW);
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void earlyReturnShortensRentalEndWithoutRefund() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1));
        BigDecimal balanceBefore = customer.getBalance();

        service.returnCar(rental.getId());

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.COMPLETED);
        assertThat(rental.getRentalEnd()).isEqualTo(NOW);
        assertThat(rental.getTotalAmount()).isEqualByComparingTo("3750.00");
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("0");
        assertThat(customer.getBalance()).isEqualByComparingTo(balanceBefore);
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void completedRentalCannotBeReturnedAgain() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(3));
        rental.complete();

        assertThatThrownBy(() -> service.returnCar(rental.getId()))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void cancellationMoreThanOneDayAheadRefundsDeposit() {
        RentalTransaction rental = pendingRental(NOW.plusDays(2));

        service.cancelReservation(rental.getId());

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(rental.getCancellationReason()).isEqualTo(CancellationReason.CUSTOMER_REQUEST);
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("750.00");
        assertThat(customer.getBalance()).isEqualByComparingTo("10750.00");
    }

    @Test
    void cancellationWithinLastDayForfeitsDeposit() {
        RentalTransaction rental = pendingRental(NOW.plusHours(10));

        service.cancelReservation(rental.getId());

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("0");
        assertThat(customer.getBalance()).isEqualByComparingTo("10000.00");
    }

    @Test
    void cancellationAfterPickupIsRejected() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1));

        assertThatThrownBy(() -> service.cancelReservation(rental.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not been picked up");
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
    }

    @Test
    void noShowsAreCancelledWithoutRefund() {
        RentalTransaction rental = pendingRental(NOW.minusHours(5));
        when(repository.findByStatusAndPickedUpAtIsNullAndRentalStartBefore(TransactionStatus.PENDING, NOW.minusHours(4)))
                .thenReturn(List.of(rental));

        int cancelled = service.cancelNoShows();

        assertThat(cancelled).isEqualTo(1);
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.CANCELLED);
        assertThat(rental.getCancellationReason()).isEqualTo(CancellationReason.NO_SHOW);
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("0");
        assertThat(customer.getBalance()).isEqualByComparingTo("10000.00");
    }

    @Test
    void companyDecisionBeforePickupRefundsDeposit() {
        RentalTransaction rental = pendingRental(NOW.plusHours(2));

        service.rollBackRental(rental.getId(), CancellationReason.COMPANY_DECISION, null, null);

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.ROLLED_BACK);
        assertThat(rental.getCancellationReason()).isEqualTo(CancellationReason.COMPANY_DECISION);
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("750.00");
        assertThat(customer.getBalance()).isEqualByComparingTo("10750.00");
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void companyDecisionAfterPickupRefundsUnusedDaysAndFreesCar() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1).minusHours(5));

        service.rollBackRental(rental.getId(), CancellationReason.COMPANY_DECISION, null, null);

        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("2500.00");
        assertThat(customer.getBalance()).isEqualByComparingTo("12500.00");
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void customerViolationBeforePickupKeepsDeposit() {
        RentalTransaction rental = pendingRental(NOW.plusHours(2));

        service.rollBackRental(rental.getId(), CancellationReason.CUSTOMER_VIOLATION, null, null);

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.ROLLED_BACK);
        assertThat(rental.getCancellationReason()).isEqualTo(CancellationReason.CUSTOMER_VIOLATION);
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("0");
        assertThat(customer.getBalance()).isEqualByComparingTo("10000.00");
    }

    @Test
    void customerViolationAfterPickupTakesCarBackWithoutRefund() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1));

        service.rollBackRental(rental.getId(), CancellationReason.CUSTOMER_VIOLATION, null, null);

        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("0");
        assertThat(customer.getBalance()).isEqualByComparingTo("10000.00");
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void customerReasonsCannotBeUsedForRollback() {
        RentalTransaction rental = pendingRental(NOW.plusDays(2));

        assertThatThrownBy(() -> service.rollBackRental(rental.getId(), CancellationReason.NO_SHOW, null, null))
                .isInstanceOf(InvalidRequestException.class);
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
    }

    @Test
    void breakdownBeforePickupIsRejected() {
        RentalTransaction rental = pendingRental(NOW.plusHours(2));

        assertThatThrownBy(() -> service.rollBackRental(
                rental.getId(), CancellationReason.BREAKDOWN, BreakdownResolution.REFUND, null))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("picked up");
    }

    @Test
    void breakdownWithoutResolutionIsRejected() {
        RentalTransaction rental = pickedUpRental(NOW.minusHours(20));

        assertThatThrownBy(() -> service.rollBackRental(rental.getId(), CancellationReason.BREAKDOWN, null, null))
                .isInstanceOf(InvalidRequestException.class);
        assertThat(car.getStatus()).isEqualTo(CarStatus.RENTED);
    }

    @Test
    void breakdownOnFirstDayWithRefundReturnsEverythingAndSendsCarToMaintenance() {
        RentalTransaction rental = pickedUpRental(NOW.minusHours(20));

        service.rollBackRental(rental.getId(), CancellationReason.BREAKDOWN, BreakdownResolution.REFUND, null);

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.ROLLED_BACK);
        assertThat(rental.getCancellationReason()).isEqualTo(CancellationReason.BREAKDOWN);
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("3750.00");
        assertThat(customer.getBalance()).isEqualByComparingTo("13750.00");
        assertThat(car.getStatus()).isEqualTo(CarStatus.MAINTENANCE);
    }

    @Test
    void breakdownLaterWithRefundReturnsOnlyUnusedDays() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1).minusHours(5));

        service.rollBackRental(rental.getId(), CancellationReason.BREAKDOWN, BreakdownResolution.REFUND, null);

        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("2500.00");
        assertThat(customer.getBalance()).isEqualByComparingTo("12500.00");
        assertThat(car.getStatus()).isEqualTo(CarStatus.MAINTENANCE);
    }

    @Test
    void breakdownWithReplacementGivesFreeCarForRemainingDays() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1));
        Car replacementCar = availableCar("4000.00");

        RentalTransaction replacement = service.rollBackRental(
                rental.getId(), CancellationReason.BREAKDOWN, BreakdownResolution.REPLACEMENT, replacementCar.getId());

        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.ROLLED_BACK);
        assertThat(rental.getRefundedAmount()).isEqualByComparingTo("0");
        assertThat(car.getStatus()).isEqualTo(CarStatus.MAINTENANCE);

        assertThat(replacement.getCar()).isSameAs(replacementCar);
        assertThat(replacement.getCustomer()).isSameAs(customer);
        assertThat(replacement.getReplacesRental()).isSameAs(rental);
        assertThat(replacement.getRentalStart()).isEqualTo(NOW);
        assertThat(replacement.getRentalEnd()).isEqualTo(rental.getRentalEnd());
        assertThat(replacement.getTotalAmount()).isEqualByComparingTo("0");
        assertThat(replacement.getDepositAmount()).isEqualByComparingTo("0");
        assertThat(replacement.isPickedUp()).isTrue();
        assertThat(replacement.getStatus()).isEqualTo(TransactionStatus.PENDING);
        assertThat(replacementCar.getStatus()).isEqualTo(CarStatus.RENTED);
        assertThat(customer.getBalance()).isEqualByComparingTo("10000.00");
    }

    @Test
    void replacementWithoutCarIsRejected() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1));

        assertThatThrownBy(() -> service.rollBackRental(
                rental.getId(), CancellationReason.BREAKDOWN, BreakdownResolution.REPLACEMENT, null))
                .isInstanceOf(InvalidRequestException.class);
    }

    @Test
    void replacementCarUnderMaintenanceIsRejected() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1));
        Car replacementCar = availableCar("1000.00");
        replacementCar.setStatus(CarStatus.MAINTENANCE);

        assertThatThrownBy(() -> service.rollBackRental(
                rental.getId(), CancellationReason.BREAKDOWN, BreakdownResolution.REPLACEMENT, replacementCar.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("not available");
        assertThat(rental.getStatus()).isEqualTo(TransactionStatus.PENDING);
    }

    @Test
    void replacementCarBookedForRemainingDaysIsRejected() {
        RentalTransaction rental = pickedUpRental(NOW.minusDays(1));
        Car replacementCar = availableCar("1000.00");
        when(repository.existsByCar_IdAndStatusInAndRentalStartLessThanAndRentalEndGreaterThan(
                eq(replacementCar.getId()), anyCollection(), eq(rental.getRentalEnd()), eq(NOW))).thenReturn(true);

        assertThatThrownBy(() -> service.rollBackRental(
                rental.getId(), CancellationReason.BREAKDOWN, BreakdownResolution.REPLACEMENT, replacementCar.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already booked");
    }

    @Test
    void finishedRentalCannotBeRolledBack() {
        RentalTransaction rental = pendingRental(NOW.plusDays(2));
        rental.cancel(CancellationReason.CUSTOMER_REQUEST);

        assertThatThrownBy(() -> service.rollBackRental(rental.getId(), CancellationReason.COMPANY_DECISION, null, null))
                .isInstanceOf(BusinessRuleException.class);
    }

    private Car availableCar(String dailyPrice) {
        Car other = new Car();
        other.setId(UUID.randomUUID());
        other.setDailyBasePrice(new BigDecimal(dailyPrice));
        other.setStatus(CarStatus.AVAILABLE);
        when(carService.getCarById(other.getId())).thenReturn(other);
        return other;
    }

    private RentalTransaction pickedUpRental(LocalDateTime start) {
        RentalTransaction rental = pendingRental(start);
        rental.setPickedUpAt(start);
        car.setStatus(CarStatus.RENTED);
        return rental;
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
        rental.setDepositAmount(new BigDecimal("750.00"));
        rental.setStatus(TransactionStatus.PENDING);

        when(repository.findById(rental.getId())).thenReturn(Optional.of(rental));
        when(repository.findFirstByCar_IdAndStatusOrderByRentalStartAsc(car.getId(), TransactionStatus.PENDING))
                .thenReturn(Optional.of(rental));
        return rental;
    }
}
