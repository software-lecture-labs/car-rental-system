package com.rentacar.rentalsystem.security;

import com.rentacar.rentalsystem.car.Car;
import com.rentacar.rentalsystem.car.CarController;
import com.rentacar.rentalsystem.car.CarImageController;
import com.rentacar.rentalsystem.car.CarImageService;
import com.rentacar.rentalsystem.car.CarService;
import com.rentacar.rentalsystem.car.CarUpdateRequest;
import com.rentacar.rentalsystem.rental.RentalTransactionController;
import com.rentacar.rentalsystem.rental.RentalTransactionRepository;
import com.rentacar.rentalsystem.rental.RentalTransactionService;
import com.rentacar.rentalsystem.user.Customer;
import com.rentacar.rentalsystem.user.CustomerController;
import com.rentacar.rentalsystem.user.CustomerService;
import com.rentacar.rentalsystem.user.CustomerUpdateRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Gerçek SecurityConfig ile: token yok -> 401, rol yetmiyor -> 403, başkasının verisi -> 403.
 * Servisler mock; burada sadece erişim kuralları test ediliyor.
 */
@WebMvcTest(controllers = {CarController.class, CarImageController.class, CustomerController.class,
        RentalTransactionController.class})
@Import({SecurityConfig.class, JwtConfig.class, RentalAccess.class})
class SecurityRulesTest {

    private static final UUID CUSTOMER_ID = UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CarService carService;

    @MockitoBean
    private CarImageService carImageService;

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

    @Test
    void customerCanUpdateOwnProfile() throws Exception {
        when(customerService.updateCustomer(eq(CUSTOMER_ID), any(CustomerUpdateRequest.class)))
                .thenReturn(customerEntity(CUSTOMER_ID));

        mockMvc.perform(put("/api/customers/{id}", CUSTOMER_ID)
                        .with(customer(CUSTOMER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PROFILE_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(CUSTOMER_ID.toString()));
    }

    @Test
    void customerCannotUpdateAnotherCustomersProfile() throws Exception {
        mockMvc.perform(put("/api/customers/{id}", UUID.randomUUID())
                        .with(customer(CUSTOMER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(PROFILE_BODY))
                .andExpect(status().isForbidden());

        verifyNoInteractions(customerService);
    }

    @Test
    void customerCannotUpdateCar() throws Exception {
        mockMvc.perform(put("/api/cars/{id}", UUID.randomUUID())
                        .with(customer(CUSTOMER_ID))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CAR_BODY))
                .andExpect(status().isForbidden());

        verifyNoInteractions(carService);
    }

    @Test
    void adminCanUpdateCar() throws Exception {
        UUID carId = UUID.randomUUID();
        Car car = new Car();
        car.setId(carId);
        when(carService.updateCar(eq(carId), any(CarUpdateRequest.class))).thenReturn(car);

        mockMvc.perform(put("/api/cars/{id}", carId)
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CAR_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(carId.toString()));
    }

    @Test
    void updatingCarWithInvalidValuesReturns400() throws Exception {
        String invalidBody = CAR_BODY.replace("\"seatCount\":5", "\"seatCount\":0");

        mockMvc.perform(put("/api/cars/{id}", UUID.randomUUID())
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(carService);
    }

    @Test
    void anyoneCanViewCarImages() throws Exception {
        UUID carId = UUID.randomUUID();
        when(carImageService.listImages(carId)).thenReturn(List.of());

        mockMvc.perform(get("/api/cars/{carId}/images", carId))
                .andExpect(status().isOk());
    }

    @Test
    void uploadingCarImageWithoutTokenReturns401() throws Exception {
        mockMvc.perform(multipart("/api/cars/{carId}/images", UUID.randomUUID()).file(imageFile()))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(carImageService);
    }

    @Test
    void customerCannotUploadCarImage() throws Exception {
        mockMvc.perform(multipart("/api/cars/{carId}/images", UUID.randomUUID())
                        .file(imageFile())
                        .with(customer(CUSTOMER_ID)))
                .andExpect(status().isForbidden());

        verifyNoInteractions(carImageService);
    }

    @Test
    void adminCanUploadCarImage() throws Exception {
        UUID carId = UUID.randomUUID();
        when(carImageService.addImages(eq(carId), anyList())).thenReturn(List.of());

        mockMvc.perform(multipart("/api/cars/{carId}/images", carId)
                        .file(imageFile())
                        .with(admin()))
                .andExpect(status().isCreated());
    }

    private static MockMultipartFile imageFile() {
        byte[] png = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        return new MockMultipartFile("files", "arac.png", "image/png", png);
    }

    private static final String PROFILE_BODY = """
            {"firstName":"Ayşe","lastName":"Yılmaz","licenseYear":2018}
            """;

    private static final String CAR_BODY = """
            {"brand":"Renault","model":"Clio","productionYear":2023,"fuelType":"HYBRID",
             "transmission":"AUTOMATIC","color":"Kırmızı","seatCount":5,"dailyBasePrice":1500.00}
            """;

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