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

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RentalTransactionService {

    private static final List<TransactionStatus> BLOCKING_STATUSES =
            List.of(TransactionStatus.PENDING, TransactionStatus.COMPLETED);

    private final RentalTransactionRepository transactionRepository;
    private final CarService carService;
    private final CustomerService customerService;
    private final PricingService pricingService;
    private final Clock clock;

    @Transactional
    public RentalTransaction rentCar(UUID customerId, UUID carId, String selectedPackage, LocalDateTime startDate, long rentalDays) {

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

        PriceQuote quote = pricingService.quote(car, selectedPackage, rentalDays);

        customer.deductBalance(quote.totalAmount());

        RentalTransaction transaction = new RentalTransaction();
        transaction.setCustomer(customer);
        transaction.setCar(car);
        transaction.setTransactionDate(LocalDateTime.now(clock));
        transaction.setRentalStart(startDate);
        transaction.setRentalEnd(endDate);
        transaction.setDailyPrice(car.getDailyBasePrice());
        transaction.setDiscountRate(quote.discountRate());
        transaction.setTotalAmount(quote.totalAmount());
        transaction.setStatus(TransactionStatus.PENDING);

        return transactionRepository.save(transaction);
    }

    @Transactional
    public void pickupCar(UUID transactionId) {
        RentalTransaction transaction = getTransactionById(transactionId);
        Car car = transaction.getCar();

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessRuleException("Only a pending rental can be picked up.");
        }
        if (LocalDate.now(clock).isBefore(transaction.getRentalStart().toLocalDate())) {
            throw new BusinessRuleException("The car can be picked up on or after the rental start date.");
        }
        if (car.getStatus() == CarStatus.MAINTENANCE) {
            throw new BusinessRuleException("The car is under maintenance.");
        }
        if (car.getStatus() == CarStatus.RENTED || !isNextOpenRental(transaction)) {
            throw new BusinessRuleException("The car has not been returned from a previous rental yet.");
        }

        car.markAsRented();
    }

    @Transactional
    public void returnCar(UUID transactionId) {
        RentalTransaction transaction = getTransactionById(transactionId);
        Car car = transaction.getCar();

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new BusinessRuleException("This rental is already completed or cancelled.");
        }
        if (car.getStatus() != CarStatus.RENTED || !isNextOpenRental(transaction)) {
            throw new BusinessRuleException("The car has not been picked up for this rental.");
        }

        car.markAsAvailable();
        transaction.complete();
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
