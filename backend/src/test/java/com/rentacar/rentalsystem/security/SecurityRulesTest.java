package com.rentacar.rentalsystem.security;

import com.rentacar.rentalsystem.car.CarController;
import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.rental.RentalTransactionController;
import com.rentacar.rentalsystem.rental.RentalTransactionRepository;
import com.rentacar.rentalsystem.rental.RentalTransactionService;
import com.rentacar.rentalsystem.user.Customer;
import com.rentacar.rentalsystem.user.CustomerController;
import com.rentacar.rentalsystem.user.CustomerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Gerçek SecurityConfig ile: token yok -> 401, rol yetmiyor -> 403, başkasının verisi -> 403.
 * Servisler mock; burada sadece erişim kuralları test ediliyor.
 */
@WebMvcTest(controllers = {CarController.class, CustomerController.class, RentalTransactionController.class})
@Import({SecurityConfig.class, JwtConfig.class, RentalAccess.class})
class SecurityRulesTest {

    private static final UUID CUSTOMER_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CarService carService;

    @MockitoBean
    private CustomerService customerService;

    @MockitoBean
    private RentalTransactionService rentalService;

    @MockitoBean
    private RentalTransactionRepository rentalRepository;

    @Test
    void anyoneCanListCars() throws Exception {
        when(carService.getAllCars()).thenReturn(List.of());

        mockMvc.perform(get("/api/cars"))
                .andExpect(status().isOk());
    }

    @Test
    void deletingCarWithoutTokenReturns401() throws Exception {
        mockMvc.perform(delete("/api/cars/{id}", UUID.randomUUID()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        verifyNoInteractions(carService);
    }

    @Test
    void customerCannotDeleteCar() throws Exception {
        mockMvc.perform(delete("/api/cars/{id}", UUID.randomUUID()).with(customer(CUSTOMER_ID)))
                .andExpect(status().isForbidden());

        verifyNoInteractions(carService);
    }

    @Test
    void adminCanDeleteCar() throws Exception {
        UUID carId = UUID.randomUUID();

        mockMvc.perform(delete("/api/cars/{id}", carId).with(admin()))
                .andExpect(status().isOk());

        verify(carService).deleteCar(carId);
    }

    @Test
    void customerCanReadOwnProfile() throws Exception {
        when(customerService.getCustomerById(CUSTOMER_ID)).thenReturn(customerEntity(CUSTOMER_ID));

        mockMvc.perform(get("/api/customers/{id}", CUSTOMER_ID).with(customer(CUSTOMER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(CUSTOMER_ID.toString()));
    }

    @Test
    void customerCannotReadAnotherCustomersProfile() throws Exception {
        mockMvc.perform(get("/api/customers/{id}", UUID.randomUUID()).with(customer(CUSTOMER_ID)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        verifyNoInteractions(customerService);
    }

    @Test
    void customerCannotListAllRentals() throws Exception {
        mockMvc.perform(get("/api/rentals").with(customer(CUSTOMER_ID)))
                .andExpect(status().isForbidden());

        verifyNoInteractions(rentalService);
    }

    @Test
    void customerCannotRentACarForSomeoneElse() throws Exception {
        String body = """
                {"customerId":"%s","carId":"%s","startDate":"%s","rentalDays":3}
                """.formatted(UUID.randomUUID(), UUID.randomUUID(), LocalDateTime.now().plusDays(1).withNano(0));

        mockMvc.perform(post("/api/rentals")
                        .with(customer(CUSTOMER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        verifyNoInteractions(rentalService);
    }

    private static RequestPostProcessor admin() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private static RequestPostProcessor customer(UUID customerId) {
        return jwt()
                .jwt(token -> token.subject(customerId.toString()))
                .authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
    }

    private static Customer customerEntity(UUID id) {
        Customer customer = new Customer();
        customer.setId(id);
        customer.setFirstName("Ali");
        customer.setLastName("Demo");
        customer.setEmail("ali@ornek.com");
        customer.setLicenseYear(2015);
        return customer;
    }
}