package com.rentacar.rentalsystem.user;

import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomerController.class)
class CustomerControllerTest {

    private static final String VALID_REGISTRATION = """
            {"firstName":"Ali","lastName":"Demo","email":"Ali.Demo@Example.com",
             "password":"secret123","licenseYear":2018,"balance":999999}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CustomerService customerService;

    @Test
    void registerReturns201WithoutPasswordAndIgnoresClientBalance() throws Exception {
        when(customerService.registerCustomer(any())).thenAnswer(invocation -> {
            Customer customer = invocation.getArgument(0);
            customer.setId(UUID.randomUUID());
            return customer;
        });

        mockMvc.perform(post("/api/customers/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REGISTRATION))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("ali.demo@example.com"))
                .andExpect(jsonPath("$.balance").value(0))
                .andExpect(jsonPath("$.password").doesNotExist());

        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(customerService).registerCustomer(captor.capture());
        assertThat(captor.getValue().getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(captor.getValue().getEmail()).isEqualTo("ali.demo@example.com");
    }

    @Test
    void registerWithInvalidFieldsReturns400WithFieldErrors() throws Exception {
        mockMvc.perform(post("/api/customers/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"","lastName":"Demo","email":"not-an-email",
                                 "password":"short","licenseYear":1900}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.errors.firstName").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists())
                .andExpect(jsonPath("$.errors.licenseYear").exists());

        verifyNoInteractions(customerService);
    }

    @Test
    void registerWithMalformedJsonReturns400() throws Exception {
        mockMvc.perform(post("/api/customers/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerWithDuplicateEmailReturns409() throws Exception {
        when(customerService.registerCustomer(any()))
                .thenThrow(new BusinessRuleException("A user with this email already exists."));

        mockMvc.perform(post("/api/customers/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_REGISTRATION))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("A user with this email already exists."));
    }

    @Test
    void unknownCustomerReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(customerService.getCustomerById(id)).thenThrow(new ResourceNotFoundException("Customer not found: " + id));

        mockMvc.perform(get("/api/customers/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource not found"));
    }

    @Test
    void invalidUuidReturns400() throws Exception {
        mockMvc.perform(get("/api/customers/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loadingNonPositiveBalanceReturns400() throws Exception {
        mockMvc.perform(put("/api/customers/{id}/balance", UUID.randomUUID()).param("amount", "-50"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.amount").exists());

        verifyNoInteractions(customerService);
    }
}
