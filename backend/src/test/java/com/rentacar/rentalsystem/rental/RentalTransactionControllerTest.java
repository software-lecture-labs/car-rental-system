package com.rentacar.rentalsystem.rental;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.exception.BusinessRuleException;
import com.rentacar.rentalsystem.user.Customer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Bu testler sadece controller davranışını ölçer; erişim kuralları security/ altındaki testlerde.
@AutoConfigureMockMvc(addFilters = false)
@WebMvcTest(RentalTransactionController.class)
class RentalTransactionControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private RentalTransactionService transactionService;

        @Test
        void rentCarReturns201WithSummaryAndWithoutCustomerSecrets() throws Exception {
                when(transactionService.rentCar(any(), any(), any(), anyLong())).thenReturn(sampleRental());

                mockMvc.perform(post("/api/rentals")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(validRequest(LocalDateTime.now().plusDays(1), 7)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.carPlate").value("34ABC123"))
                                .andExpect(jsonPath("$.customerFullName").value("Ali Demo"))
                                .andExpect(jsonPath("$.totalAmount").value(7875.00))
                                .andExpect(jsonPath("$.customer").doesNotExist())
                                .andExpect(jsonPath("$.password").doesNotExist());
        }

        @Test
        void rentCarWithMissingFieldsPastDateAndZeroDaysReturns400() throws Exception {
                mockMvc.perform(post("/api/rentals")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"selectedPackage":"WEEKLY","startDate":"2020-01-01T10:00:00","rentalDays":0}
                                                """))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.errors.customerId").exists())
                                .andExpect(jsonPath("$.errors.carId").exists())
                                .andExpect(jsonPath("$.errors.startDate").exists())
                                .andExpect(jsonPath("$.errors.rentalDays").exists());

                verifyNoInteractions(transactionService);
        }

        @Test
        void insufficientBalanceReturns409() throws Exception {
                when(transactionService.rentCar(any(), any(), any(), anyLong()))
                                .thenThrow(new BusinessRuleException("Insufficient balance."));

                mockMvc.perform(post("/api/rentals")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(validRequest(LocalDateTime.now().plusDays(1), 7)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.detail").value("Insufficient balance."));
        }

        @Test
        void overlappingRentalFromDatabaseReturns409() throws Exception {
                when(transactionService.rentCar(any(), any(), any(), anyLong()))
                                .thenThrow(new DataIntegrityViolationException("overlap",
                                                new SQLException("exclusion", "23P01")));

                mockMvc.perform(post("/api/rentals")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(validRequest(LocalDateTime.now().plusDays(1), 7)))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.title").value("Car already booked"));
        }

        @Test
        void pickupReturns200() throws Exception {
                mockMvc.perform(put("/api/rentals/{id}/pickup", UUID.randomUUID()))
                                .andExpect(status().isOk());
        }

        @Test
        void pickupBeforeStartDateReturns409() throws Exception {
                UUID id = UUID.randomUUID();
                doThrow(new BusinessRuleException("The car can be picked up on or after the rental start date."))
                                .when(transactionService).pickupCar(id);

                mockMvc.perform(put("/api/rentals/{id}/pickup", id))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.detail")
                                                .value("The car can be picked up on or after the rental start date."));
        }

        @Test
        void cancelReturnsRentalWithRefundedDeposit() throws Exception {
                UUID id = UUID.randomUUID();
                RentalTransaction rental = sampleRental();
                rental.setRefundedAmount(new BigDecimal("1575.00"));
                rental.cancel(CancellationReason.CUSTOMER_REQUEST);
                when(transactionService.cancelReservation(id)).thenReturn(rental);

                mockMvc.perform(put("/api/rentals/{id}/cancel", id))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("CANCELLED"))
                                .andExpect(jsonPath("$.cancellationReason").value("CUSTOMER_REQUEST"))
                                .andExpect(jsonPath("$.depositAmount").value(1575.00))
                                .andExpect(jsonPath("$.refundedAmount").value(1575.00));
        }

        @Test
        void cancelAfterPickupReturns409() throws Exception {
                UUID id = UUID.randomUUID();
                when(transactionService.cancelReservation(id))
                                .thenThrow(new BusinessRuleException(
                                                "Only a reservation that has not been picked up can be cancelled."));

                mockMvc.perform(put("/api/rentals/{id}/cancel", id))
                                .andExpect(status().isConflict())
                                .andExpect(jsonPath("$.detail").value(
                                                "Only a reservation that has not been picked up can be cancelled."));
        }

        @Test
        void rollbackWithBreakdownRefundReturnsRolledBackRental() throws Exception {
                UUID id = UUID.randomUUID();
                RentalTransaction rental = sampleRental();
                rental.setRefundedAmount(new BigDecimal("7875.00"));
                rental.rollBack(CancellationReason.BREAKDOWN);
                when(transactionService.rollBackRental(id, CancellationReason.BREAKDOWN, BreakdownResolution.REFUND,
                                null))
                                .thenReturn(rental);

                mockMvc.perform(put("/api/rentals/{id}/rollback", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"reason":"BREAKDOWN","resolution":"REFUND"}
                                                """))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("ROLLED_BACK"))
                                .andExpect(jsonPath("$.cancellationReason").value("BREAKDOWN"))
                                .andExpect(jsonPath("$.refundedAmount").value(7875.00));
        }

        @Test
        void rollbackWithReplacementReturnsNewFreeRental() throws Exception {
                UUID id = UUID.randomUUID();
                UUID replacementCarId = UUID.randomUUID();
                RentalTransaction original = sampleRental();
                original.setId(id);
                RentalTransaction replacement = sampleRental();
                replacement.setTotalAmount(new BigDecimal("0.00"));
                replacement.setDepositAmount(new BigDecimal("0.00"));
                replacement.setReplacesRental(original);
                when(transactionService.rollBackRental(id, CancellationReason.BREAKDOWN,
                                BreakdownResolution.REPLACEMENT, replacementCarId))
                                .thenReturn(replacement);

                mockMvc.perform(put("/api/rentals/{id}/rollback", id)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"reason":"BREAKDOWN","resolution":"REPLACEMENT","replacementCarId":"%s"}
                                                """
                                                .formatted(replacementCarId)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value("PENDING"))
                                .andExpect(jsonPath("$.totalAmount").value(0))
                                .andExpect(jsonPath("$.replacesRentalId").value(id.toString()));
        }

        @Test
        void rollbackWithoutReasonReturns400() throws Exception {
                mockMvc.perform(put("/api/rentals/{id}/rollback", UUID.randomUUID())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.errors.reason").exists());

                verifyNoInteractions(transactionService);
        }

        @Test
        void listRentalsReturnsSummaries() throws Exception {
                when(transactionService.getAllTransactions()).thenReturn(List.of(sampleRental()));

                mockMvc.perform(get("/api/rentals"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].carPlate").value("34ABC123"))
                                .andExpect(jsonPath("$[0].status").value("PENDING"));
        }

        @Test
        void unknownStatusInPathReturns400() throws Exception {
                mockMvc.perform(get("/api/rentals/status/{status}", "FINISHED"))
                                .andExpect(status().isBadRequest());
        }

        private static String validRequest(LocalDateTime startDate, long days) {
                return """
                                {"customerId":"%s","carId":"%s","selectedPackage":"WEEKLY","startDate":"%s","rentalDays":%d}
                                """
                                .formatted(UUID.randomUUID(), UUID.randomUUID(), startDate.withNano(0), days);
        }

        private static RentalTransaction sampleRental() {
                Car car = new Car();
                car.setId(UUID.randomUUID());
                car.setPlate("34ABC123");
                car.setBrand("Renault");
                car.setModel("Clio");

                Customer customer = new Customer();
                customer.setId(UUID.randomUUID());
                customer.setFirstName("Ali");
                customer.setLastName("Demo");
                customer.setPassword("secret123");

                RentalTransaction rental = new RentalTransaction();
                rental.setId(UUID.randomUUID());
                rental.setCar(car);
                rental.setCustomer(customer);
                rental.setRentalStart(LocalDateTime.now().plusDays(1));
                rental.setRentalEnd(LocalDateTime.now().plusDays(8));
                rental.setDailyPrice(new BigDecimal("1250.00"));
                rental.setDiscountRate(new BigDecimal("0.1000"));
                rental.setTotalAmount(new BigDecimal("7875.00"));
                rental.setDepositAmount(new BigDecimal("1575.00"));
                rental.setStatus(TransactionStatus.PENDING);
                return rental;
        }
}
