package com.rentacar.rentalsystem.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public Customer registerCustomer(Customer customer) {
        if (userRepository.findByEmail(customer.getEmail()).isPresent()) {
            throw new IllegalArgumentException("A user with this email already exists in the system!");
        }
        customer.setRole(Role.CUSTOMER);

        return customerRepository.save(customer);
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Customer getCustomerById(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with the given ID."));
    }

    public void loadBalance(UUID customerId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Loaded amount must be bigger than zero!");
        }

        Customer customer = getCustomerById(customerId);
        customer.addBalance(amount);

        customerRepository.save(customer);
    }

    public void deleteCustomer(UUID id) {
        Customer customer = getCustomerById(id);
        customerRepository.delete(customer);
    }

    public Customer getCustomerByEmail(String email) {
        return customerRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with this email."));
    }

    public List<Customer> getCustomersByFirstName(String firstName) {
        return customerRepository.findByFirstNameContainingIgnoreCase(firstName);
    }

    public List<Customer> getCustomersByLastName(String lastName) {
        return customerRepository.findByLastNameContainingIgnoreCase(lastName);
    }

    public List<Customer> getCustomersByLicenseYear(int licenseYear) {
        return customerRepository.findByLicenseYear(licenseYear);
    }
}