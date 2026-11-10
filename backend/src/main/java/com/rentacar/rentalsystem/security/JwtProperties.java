package com.rentacar.rentalsystem.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * application.yml'deki app.jwt.* ayarları.
 * secret: base64 kodlu, en az 32 byte (HS256 için 256 bit) anahtar.
 * Gerçek ortamda APP_JWT_SECRET ortam değişkeniyle verilir.
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, Duration expiration, String issuer) {
}