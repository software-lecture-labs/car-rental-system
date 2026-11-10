package com.rentacar.rentalsystem.security;

import com.rentacar.rentalsystem.rental.RentalTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * @PreAuthorize içinden "@rentalAccess.isOwner(#id, authentication)" diye çağrılır.
 * Kiralama giriş yapan müşterinin mi?
 */
@Component("rentalAccess")
@RequiredArgsConstructor
public class RentalAccess {

    private final RentalTransactionRepository rentalRepository;

    @Transactional(readOnly = true)
    public boolean isOwner(UUID rentalId, Authentication authentication) {
        return rentalRepository.findById(rentalId)
                .map(rental -> rental.getCustomer().getId().toString().equals(authentication.getName()))
                // kiralama yoksa erişimi engelleme; servis zaten 404 döndürecek
                .orElse(true);
    }
}