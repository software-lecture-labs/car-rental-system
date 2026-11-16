package com.rentacar.rentalsystem.user;

import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CustomerServiceTest {

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private CustomerRepository customerRepository;
    private UserRepository userRepository;
    private CustomerService service;

    @BeforeEach
    void setUp() {
        customerRepository = mock(CustomerRepository.class);
        userRepository = mock(UserRepository.class);
        service = new CustomerService(customerRepository, userRepository, passwordEncoder);
    }

    @Test
    void updateCustomerChangesNameAndLicenseButKeepsEmailAndBalance() {
        UUID id = UUID.randomUUID();
        Customer customer = customer(id);
        when(customerRepository.findById(id)).thenReturn(Optional.of(customer));
        when(customerRepository.save(customer)).thenReturn(customer);

        Customer updated = service.updateCustomer(id, new CustomerUpdateRequest(" Ayşe ", " Yılmaz ", 2018));

        assertThat(updated.getFirstName()).isEqualTo("Ayşe");
        assertThat(updated.getLastName()).isEqualTo("Yılmaz");
        assertThat(updated.getLicenseYear()).isEqualTo(2018);
        assertThat(updated.getEmail()).isEqualTo("ali@ornek.com");
        assertThat(updated.getBalance()).isEqualByComparingTo("500.00");
        verify(customerRepository).save(customer);
    }

    @Test
    void updateCustomerThrowsWhenCustomerDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(customerRepository.findById(id)).thenReturn(Optional.empty());

        CustomerUpdateRequest request = new CustomerUpdateRequest("Ayşe", "Yılmaz", 2018);

        assertThatThrownBy(() -> service.updateCustomer(id, request)).isInstanceOf(ResourceNotFoundException.class);
        verify(customerRepository, never()).save(any());
    }

    @Test
    void registerCustomerStoresPasswordAsBcryptHash() {
        Customer customer = customer(null);
        customer.setPassword("Sifre123!");
        when(userRepository.findByEmail("ali@ornek.com")).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Customer saved = service.registerCustomer(customer);

        assertThat(saved.getPassword()).isNotEqualTo("Sifre123!").startsWith("$2");
        assertThat(passwordEncoder.matches("Sifre123!", saved.getPassword())).isTrue();
        assertThat(saved.getRole()).isEqualTo(Role.CUSTOMER);
    }

    private static Customer customer(UUID id) {
        Customer customer = new Customer();
        customer.setId(id);
        customer.setFirstName("Ali");
        customer.setLastName("Demo");
        customer.setEmail("ali@ornek.com");
        customer.setLicenseYear(2015);
        customer.setBalance(new BigDecimal("500.00"));
        return customer;
    }
}
