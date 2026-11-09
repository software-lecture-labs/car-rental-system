package com.rentacar.rentalsystem.security;

import java.time.Instant;

public record IssuedToken(String value, Instant expiresAt) {
}