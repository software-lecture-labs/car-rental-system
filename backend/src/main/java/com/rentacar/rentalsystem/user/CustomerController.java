package com.rentacar.rentalsystem.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping("/register")
    public ResponseEntity<Customer> registerCustomer(@RequestBody Customer customer) {
        Customer savedCustomer = customerService.registerCustomer(customer);
        return new ResponseEntity<>(savedCustomer, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Customer> getCustomerByEmail(@PathVariable String email) {
        return ResponseEntity.ok(customerService.getCustomerByEmail(email));
    }

    @GetMapping("/search/firstname")
    public ResponseEntity<List<Customer>> getCustomersByFirstName(@RequestParam String name) {
        return ResponseEntity.ok(customerService.getCustomersByFirstName(name));
    }

    @GetMapping("/search/licenseyear")
    public ResponseEntity<List<Customer>> getCustomersByLicenseYear(@RequestParam int year) {
        return ResponseEntity.ok(customerService.getCustomersByLicenseYear(year));
    }

    @PutMapping("/{id}/balance")
    public ResponseEntity<String> loadBalance(@PathVariable UUID id, @RequestParam BigDecimal amount) {
        customerService.loadBalance(id, amount);
        return ResponseEntity.ok("Balance loaded successfully.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok("Customer deleted successfully.");
    }
}