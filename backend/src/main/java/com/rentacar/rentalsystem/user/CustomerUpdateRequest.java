package com.rentacar.rentalsystem.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Müşterinin değiştirebileceği bilgiler: ad, soyad, ehliyet yılı.
 * E-posta giriş bilgisi olduğu için burada yok; şifre ve bakiye de kendi akışlarından değişir.
 */
public record CustomerUpdateRequest(

        @NotBlank @Size(max = 50)
        String firstName,

        @NotBlank @Size(max = 50)
        String lastName,

        @NotNull @Min(1950) @Max(2100)
        Integer licenseYear
) {

    void applyTo(Customer customer) {
        customer.setFirstName(firstName.trim());
        customer.setLastName(lastName.trim());
        customer.setLicenseYear(licenseYear);
    }
}
