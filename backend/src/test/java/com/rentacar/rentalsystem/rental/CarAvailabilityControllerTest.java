package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.exception.InvalidRequestException;
import com.rentacar.rentalsystem.pricing.PriceQuote;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Bu testler sadece controller davranışını ölçer; erişim kuralları security/ altındaki testlerde.
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(CarAvailabilityController.class)
class CarAvailabilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CarAvailabilityService availabilityService;

    @Test
    void returnsAvailableCarsWithPrices() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(10).withNano(0);
        when(availabilityService.findAvailableCars(start, 5, "price,asc")).thenReturn(List.of(sampleOffer()));

        mockMvc.perform(get("/api/cars/available")
                .param("start", start.toString())
                .param("days", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].car.plate").value("34ABC123"))
                .andExpect(jsonPath("$[0].rentalDays").value(5))
                .andExpect(jsonPath("$[0].totalAmount").value(6250.00))
                .andExpect(jsonPath("$[0].depositAmount").value(1250.00))
                .andExpect(jsonPath("$[0].amountDueAtPickup").value(5000.00));
    }

    @Test
    void passesSortToService() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(10).withNano(0);
        when(availabilityService.findAvailableCars(eq(start), eq(5L), eq("price,desc"))).thenReturn(List.of());

        mockMvc.perform(get("/api/cars/available")
                .param("start", start.toString())
                .param("days", "5")
                .param("sort", "price,desc"))
                .andExpect(status().isOk());
    }

    @Test
    void missingStartReturns400() throws Exception {
        mockMvc.perform(get("/api/cars/available").param("days", "5"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(availabilityService);
    }

    @Test
    void pastStartAndZeroDaysReturn400() throws Exception {
        mockMvc.perform(get("/api/cars/available")
                .param("start", "2020-01-01T10:00")
                .param("days", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.start").exists())
                .andExpect(jsonPath("$.errors.days").exists());

        verifyNoInteractions(availabilityService);
    }

    @Test
    void unknownSortReturns400() throws Exception {
        when(availabilityService.findAvailableCars(org.mockito.ArgumentMatchers.any(), eq(5L), anyString()))
                .thenThrow(new InvalidRequestException("Sort must be 'price,asc' or 'price,desc'."));

        mockMvc.perform(get("/api/cars/available")
                .param("start", LocalDateTime.now().plusDays(1).withNano(0).toString())
                .param("days", "5")
                .param("sort", "brand"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Sort must be 'price,asc' or 'price,desc'."));
    }

    private static AvailableCarResponse sampleOffer() {
        Car car = new Car();
        car.setId(UUID.randomUUID());
        car.setBrand("Renault");
        car.setModel("Clio");
        car.setPlate("34ABC123");
        car.setDailyBasePrice(new BigDecimal("1250.00"));
        return AvailableCarResponse.from(car, 5, new PriceQuote(BigDecimal.ZERO, new BigDecimal("6250.00")));
    }
}
