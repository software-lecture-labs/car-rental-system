package com.rentacar.rentalsystem.auth;

import com.rentacar.rentalsystem.user.Role;
import com.rentacar.rentalsystem.user.User;

import java.util.UUID;

/** GET /api/auth/me cevabı: token'ın sahibi olan kullanıcı. */
public record CurrentUserResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        Role role
) {

    public static CurrentUserResponse from(User user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }
}