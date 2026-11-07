package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.car.CarStatus;
import com.rentacar.rentalsystem.pricing.PricingPolicy;
import com.rentacar.rentalsystem.pricing.PricingPolicyRepository;
import com.rentacar.rentalsystem.pricing.PricingService;
import com.rentacar.rentalsystem.user.Customer;
import com.rentacar.rentalsystem.user.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RentalTransactionService {

    private final RentalTransactionRepository transactionRepository;
    private final CarService carService;
    private final CustomerService customerService;
    private final PricingService pricingService;
    private final PricingPolicyRepository policyRepository;

    @Transactional
    public RentalTransaction rentCar(UUID customerId, UUID carId, String selectedPackage, LocalDateTime startDate, long rentalDays) {

        Customer customer = customerService.getCustomerById(customerId);
        Car car = carService.getCarById(carId);

        if (car.getStatus() != CarStatus.AVAILABLE) {
            throw new IllegalStateException("The selected car is not available for rent right now!");
        }

        BigDecimal totalAmount = pricingService.calculatePrice(car, selectedPackage, rentalDays);

        customer.deductBalance(totalAmount);

        car.markAsRented();

        RentalTransaction transaction = new RentalTransaction();
        transaction.setCustomer(customer);
        transaction.setCar(car);

        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setRentalStart(startDate);
        transaction.setRentalEnd(startDate.plusDays(rentalDays));
        transaction.setDailyPrice(car.getDailyBasePrice());

        BigDecimal appliedDiscount = BigDecimal.ZERO;
        if (selectedPackage != null && !selectedPackage.isBlank()
                && !selectedPackage.equalsIgnoreCase(PricingService.DAILY_PACKAGE)) {
            PricingPolicy policy = policyRepository.findByPolicyNameIgnoreCase(selectedPackage).orElse(null);
            if (policy != null && rentalDays >= policy.getMinDays()) {
                appliedDiscount = policy.getDiscountRate();
            }
        }
        transaction.setDiscountRate(appliedDiscount);

        transaction.setTotalAmount(totalAmount);
        transaction.setStatus(TransactionStatus.PENDING);

        return transactionRepository.save(transaction);
    }

    @Transactional
    public void returnCar(UUID transactionId) {
        RentalTransaction transaction = getTransactionById(transactionId);

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new IllegalStateException("This transaction is already completed or cancelled.");
        }

        Car car = transaction.getCar();
        car.markAsAvailable();

        transaction.complete();
        transactionRepository.save(transaction);
    }

    public RentalTransaction getTransactionById(UUID id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rental transaction not found!"));
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