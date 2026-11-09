package com.rentacar.rentalsystem.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    public ResponseEntity<CustomerResponse> registerCustomer(@Valid @RequestBody CustomerRegisterRequest request) {
        Customer savedCustomer = customerService.registerCustomer(request.toEntity());
        return new ResponseEntity<>(CustomerResponse.from(savedCustomer), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CustomerResponse>> getAllCustomers() {
        return ResponseEntity.ok(toResponses(customerService.getAllCustomers()));
    }

    @PreAuthorize("hasRole('ADMIN') or #id.toString() == authentication.name")
    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable UUID id) {
        return ResponseEntity.ok(CustomerResponse.from(customerService.getCustomerById(id)));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<CustomerResponse> getCustomerByEmail(@PathVariable String email) {
        return ResponseEntity.ok(CustomerResponse.from(customerService.getCustomerByEmail(email)));
    }

    @GetMapping("/search/firstname")
    public ResponseEntity<List<CustomerResponse>> getCustomersByFirstName(@RequestParam String name) {
        return ResponseEntity.ok(toResponses(customerService.getCustomersByFirstName(name)));
    }

    @GetMapping("/search/licenseyear")
    public ResponseEntity<List<CustomerResponse>> getCustomersByLicenseYear(@RequestParam int year) {
        return ResponseEntity.ok(toResponses(customerService.getCustomersByLicenseYear(year)));
    }

    @PreAuthorize("hasRole('ADMIN') or #id.toString() == authentication.name")
    @PutMapping("/{id}/balance")
    public ResponseEntity<String> loadBalance(@PathVariable UUID id, @RequestParam @Positive BigDecimal amount) {
        customerService.loadBalance(id, amount);
        return ResponseEntity.ok("Balance loaded successfully.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok("Customer deleted successfully.");
    }

    private static List<CustomerResponse> toResponses(List<Customer> customers) {
        return customers.stream().map(CustomerResponse::from).toList();
    }
}