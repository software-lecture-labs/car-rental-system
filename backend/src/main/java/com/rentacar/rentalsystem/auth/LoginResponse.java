package com.rentacar.rentalsystem.auth;

import com.rentacar.rentalsystem.security.IssuedToken;
import com.rentacar.rentalsystem.user.Role;
import com.rentacar.rentalsystem.user.User;

import java.time.Instant;
import java.util.UUID;

/**
 * Frontend accessToken'ı saklar ve sonraki isteklerde "Authorization: Bearer <accessToken>" başlığıyla gönderir.
 */
public record LoginResponse(
        String accessToken,
        String tokenType,
        Instant expiresAt,
        UUID userId,
        String email,
        String firstName,
        String lastName,
        Role role
) {

    public static LoginResponse of(User user, IssuedToken token) {
        return new LoginResponse(
                token.value(),
                "Bearer",
                token.expiresAt(),
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole()
        );
    }
}