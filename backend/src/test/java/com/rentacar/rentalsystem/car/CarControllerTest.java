package com.rentacar.rentalsystem.car;

import com.rentacar.rentalsystem.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.SQLException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Bu testler sadece controller davranışını ölçer; erişim kuralları security/ altındaki testlerde.
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(CarController.class)
class CarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CarService carService;

    @Test
    void addCarNormalizesPlateAndReturns201AsAvailable() throws Exception {
        when(carService.addCar(any())).thenAnswer(invocation -> {
            Car car = invocation.getArgument(0);
            car.setId(UUID.randomUUID());
            return car;
        });

        mockMvc.perform(post("/api/cars")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"brand":"Renault","model":"Clio","productionYear":2022,"fuelType":"GASOLINE",
                                 "transmission":"MANUAL","color":"White","plate":"34 abc 123","seatCount":5,
                                 "dailyBasePrice":1250.00,"status":"RENTED"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.plate").value("34ABC123"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));

        ArgumentCaptor<Car> captor = ArgumentCaptor.forClass(Car.class);
        verify(carService).addCar(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    void addCarWithInvalidValuesReturns400() throws Exception {
        mockMvc.perform(post("/api/cars")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"brand":"Renault","model":"Clio","productionYear":2022,"fuelType":"GASOLINE",
                                 "transmission":"MANUAL","color":"White","plate":"ABC","seatCount":0,
                                 "dailyBasePrice":-5}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.plate").exists())
                .andExpect(jsonPath("$.errors.seatCount").exists())
                .andExpect(jsonPath("$.errors.dailyBasePrice").exists());

        verifyNoInteractions(carService);
    }

    @Test
    void addCarWithUnknownFuelTypeReturns400() throws Exception {
        mockMvc.perform(post("/api/cars")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"brand":"Renault","model":"Clio","productionYear":2022,"fuelType":"STEAM",
                                 "transmission":"MANUAL","color":"White","plate":"34ABC123","seatCount":5,
                                 "dailyBasePrice":1250.00}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deletingRentedCarReturns409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new BusinessRuleException("A rented car cannot be deleted. Wait until it is returned."))
                .when(carService).deleteCar(id);

        mockMvc.perform(delete("/api/cars/{id}", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Business rule violation"));
    }

    @Test
    void deletingCarWithRentalHistoryReturns409() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new DataIntegrityViolationException("fk", new SQLException("restrict violation", "23001")))
                .when(carService).deleteCar(id);

        mockMvc.perform(delete("/api/cars/{id}", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Resource in use"));
    }
}
