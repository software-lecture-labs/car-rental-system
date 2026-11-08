package com.rentacar.rentalsystem.user;

import java.math.BigDecimal;
import java.util.UUID;

/** Customer data returned by the API. The password is never exposed. */
public record CustomerResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        int licenseYear,
        BigDecimal balance
) {

    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getFirstName(),
                customer.getLastName(),
                customer.getEmail(),
                customer.getLicenseYear(),
                customer.getBalance()
        );
    }
}
