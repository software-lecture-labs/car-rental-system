package com.rentacar.rentalsystem.pricing;

import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PricingController.class)
class PricingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PricingService pricingService;

    @Test
    void listPoliciesReturns200() throws Exception {
        PricingPolicy weekly = new PricingPolicy();
        weekly.setId(UUID.randomUUID());
        weekly.setPolicyName("WEEKLY");
        weekly.setMinDays(7);
        weekly.setDiscountRate(new BigDecimal("0.1000"));
        when(pricingService.getAllPricingPolicies()).thenReturn(List.of(weekly));

        mockMvc.perform(get("/api/pricing/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].policyName").value("WEEKLY"))
                .andExpect(jsonPath("$[0].minDays").value(7));
    }

    @Test
    void discountRateOfOneOrMoreReturns400() throws Exception {
        mockMvc.perform(put("/api/pricing/policies/{name}", "WEEKLY").param("rate", "1.0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.rate").exists());

        verifyNoInteractions(pricingService);
    }

    @Test
    void unknownPolicyReturns404() throws Exception {
        doThrow(new ResourceNotFoundException("Pricing policy not found: YEARLY"))
                .when(pricingService).updateDiscountRate(eq("YEARLY"), any());

        mockMvc.perform(put("/api/pricing/policies/{name}", "YEARLY").param("rate", "0.25"))
                .andExpect(status().isNotFound());
    }
}
