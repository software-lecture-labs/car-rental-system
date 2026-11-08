package com.rentacar.rentalsystem.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record CustomerRegisterRequest(

        @NotBlank @Size(max = 50)
        String firstName,

        @NotBlank @Size(max = 50)
        String lastName,

        @NotBlank @Email @Size(max = 255)
        String email,

        @NotBlank @Size(min = 8, max = 72)
        String password,

        @Min(1950) @Max(2100)
        int licenseYear
) {

    public Customer toEntity() {
        Customer customer = new Customer();
        customer.setFirstName(firstName.trim());
        customer.setLastName(lastName.trim());
        customer.setEmail(email.trim().toLowerCase(Locale.ROOT));
        customer.setPassword(password);
        customer.setLicenseYear(licenseYear);
        return customer;
    }
}
