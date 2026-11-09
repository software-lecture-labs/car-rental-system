package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.car.CarStatus;
import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import com.rentacar.rentalsystem.pricing.PriceQuote;
import com.rentacar.rentalsystem.pricing.PricingService;
import com.rentacar.rentalsystem.user.Customer;
import com.rentacar.rentalsystem.user.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RentalTransactionService {

    private static final List<TransactionStatus> BLOCKING_STATUSES =
            List.of(TransactionStatus.PENDING, TransactionStatus.COMPLETED);

    private static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.20");
    private static final Duration FREE_CANCELLATION_NOTICE = Duration.ofHours(24);
    private static final Duration NO_SHOW_GRACE_PERIOD = Duration.ofHours(4);

    private final RentalTransactionRepository transactionRepository;
    private final CarService carService;
    private final CustomerService customerService;
    private final PricingService pricingService;
    private final Clock clock;

    @Transactional
    public RentalTransaction rentCar(UUID customerId, UUID carId, LocalDateTime startDate, long rentalDays) {

        Customer customer = customerService.getCustomerById(customerId);
        Car car = carService.getCarById(carId);

        if (car.getStatus() == CarStatus.MAINTENANCE) {
            throw new BusinessRuleException("The selected car is under maintenance.");
        }

        LocalDateTime endDate = startDate.plusDays(rentalDays);
        if (transactionRepository.existsByCar_IdAndStatusInAndRentalStartLessThanAndRentalEndGreaterThan(
                carId, BLOCKING_STATUSES, endDate, startDate)) {
            throw new BusinessRuleException("The car is already booked for the selected dates.");
        }

        PriceQuote quote = pricingService.quote(car, rentalDays);
        BigDecimal deposit = PricingService.roundMoney(quote.totalAmount().multiply(DEPOSIT_RATE));

        customer.deductBalance(deposit);

        RentalTransaction transaction = new RentalTransaction();
        transaction.setCustomer(customer);
        transaction.setCar(car);
        transaction.setTransactionDate(LocalDateTime.now(clock));
        transaction.setRentalStart(startDate);
        transaction.setRentalEnd(endDate);
        transaction.setDailyPrice(car.getDailyBasePrice());
        transaction.setDiscountRate(quote.discountRate());
        transaction.setTotalAmount(quote.totalAmount());
        transaction.setDepositAmount(deposit);
        transaction.setStatus(TransactionStatus.PENDING);

        return transactionRepository.save(transaction);
    }

    @Transactional
    public void pickupCar(UUID transactionId) {
        RentalTransaction transaction = getTransactionById(transactionId);
        Car car = transaction.getCar();
        LocalDateTime now = LocalDateTime.now(clock);

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessRuleException("Only a pending rental can be picked up.");
        }
        if (transaction.isPickedUp()) {
            throw new BusinessRuleException("The car has already been picked up for this rental.");
        }
        if (now.toLocalDate().isBefore(transaction.getRentalStart().toLocalDate())) {
            throw new BusinessRuleException("The car can be picked up on or after the rental start date.");
        }
        if (now.isAfter(noShowDeadline(transaction))) {
            throw new BusinessRuleException("The pickup time for this reservation has expired.");
        }
        if (car.getStatus() == CarStatus.MAINTENANCE) {
            throw new BusinessRuleException("The car is under maintenance.");
        }
        if (car.getStatus() == CarStatus.RENTED || !isNextOpenRental(transaction)) {
            throw new BusinessRuleException("The car has not been returned from a previous rental yet.");
        }

        transaction.getCustomer().deductBalance(transaction.getRemainingAmount());
        car.markAsRented();
        transaction.setPickedUpAt(now);
    }

    @Transactional
    public void returnCar(UUID transactionId) {
        RentalTransaction transaction = getTransactionById(transactionId);
        LocalDateTime now = LocalDateTime.now(clock);

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessRuleException("This rental is already completed or cancelled.");
        }
        if (!transaction.isPickedUp()) {
            throw new BusinessRuleException("The car has not been picked up for this rental.");
        }

        if (now.isBefore(transaction.getRentalEnd())) {
            LocalDateTime earliestEnd = transaction.getRentalStart().plusMinutes(1);
            transaction.setRentalEnd(now.isAfter(earliestEnd) ? now : earliestEnd);
        }

        transaction.getCar().markAsAvailable();
        transaction.complete();
    }

    @Transactional
    public RentalTransaction cancelReservation(UUID transactionId) {
        RentalTransaction transaction = getTransactionById(transactionId);

        if (transaction.getStatus() != TransactionStatus.PENDING || transaction.isPickedUp()) {
            throw new BusinessRuleException("Only a reservation that has not been picked up can be cancelled.");
        }

        LocalDateTime freeCancellationDeadline = transaction.getRentalStart().minus(FREE_CANCELLATION_NOTICE);
        if (LocalDateTime.now(clock).isBefore(freeCancellationDeadline)) {
            refund(transaction, transaction.getDepositAmount());
        }

        transaction.cancel();
        return transaction;
    }

    @Transactional
    public RentalTransaction rollBackRental(UUID transactionId) {
        RentalTransaction transaction = getTransactionById(transactionId);

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessRuleException("Only an active rental can be rolled back.");
        }

        if (transaction.isPickedUp()) {
            refund(transaction, unusedDaysAmount(transaction));
            transaction.getCar().markAsMaintenance();
        } else {
            refund(transaction, transaction.getDepositAmount());
        }

        transaction.rollBack();
        return transaction;
    }

    @Transactional
    public int cancelNoShows() {
        LocalDateTime latestStart = LocalDateTime.now(clock).minus(NO_SHOW_GRACE_PERIOD);
        List<RentalTransaction> noShows = transactionRepository
                .findByStatusAndPickedUpAtIsNullAndRentalStartBefore(TransactionStatus.PENDING, latestStart);

        noShows.forEach(RentalTransaction::cancel);
        return noShows.size();
    }

    private BigDecimal unusedDaysAmount(RentalTransaction transaction) {
        long rentalDays = transaction.getRentalDays();
        long fullDaysUsed = Duration.between(transaction.getRentalStart(), LocalDateTime.now(clock)).toDays();
        long usedDays = Math.clamp(fullDaysUsed, 0, rentalDays);

        BigDecimal usedAmount = transaction.getTotalAmount()
                .multiply(BigDecimal.valueOf(usedDays))
                .divide(BigDecimal.valueOf(rentalDays), 2, RoundingMode.HALF_UP);
        return transaction.getTotalAmount().subtract(usedAmount);
    }

    private void refund(RentalTransaction transaction, BigDecimal amount) {
        transaction.getCustomer().addBalance(amount);
        transaction.setRefundedAmount(amount);
    }

    private LocalDateTime noShowDeadline(RentalTransaction transaction) {
        return transaction.getRentalStart().plus(NO_SHOW_GRACE_PERIOD);
    }

    private boolean isNextOpenRental(RentalTransaction transaction) {
        return transactionRepository
                .findFirstByCar_IdAndStatusOrderByRentalStartAsc(transaction.getCar().getId(), TransactionStatus.PENDING)
                .map(next -> next.getId().equals(transaction.getId()))
                .orElse(false);
    }

    public RentalTransaction getTransactionById(UUID id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rental not found: " + id));
    }

    public List<RentalTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }


    public List<RentalTransaction> getTransactionsByCustomer(UUID customerId) {
        return transactionRepository.findByCustomer_Id(customerId);
    }

    public List<RentalTransaction> getTransactionsByCar(UUID carId) {
        return transactionRepository.findByCar_Id(carId);
    }

    public List<RentalTransaction> getTransactionsByStatus(TransactionStatus status) {
        return transactionRepository.findByStatus(status);
    }
}
