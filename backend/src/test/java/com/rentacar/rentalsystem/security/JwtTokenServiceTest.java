package com.rentacar.rentalsystem.security;

import com.rentacar.rentalsystem.user.Role;
import com.rentacar.rentalsystem.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import javax.crypto.SecretKey;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenServiceTest {

    private static final String SECRET = "MbKxKbA1hJoT39tnW+HN2YlpSal+eYlqpAjmpoPLmsEpirDbafiBCUmMGBNRe6pz";
    private static final String OTHER_SECRET = "c2Fobm9vYW5haHRhcmJhc2thYmlyYW5haHRhcmRpcmVuMzJieXRlb2xzdW4hIQ==";

    private final JwtConfig config = new JwtConfig();
    private final JwtProperties properties = new JwtProperties(SECRET, Duration.ofHours(2), "rentacar");
    private final SecretKey key = config.jwtSecretKey(properties);
    private final JwtTokenService tokenService =
            new JwtTokenService(config.jwtEncoder(key), properties, Clock.systemUTC());

    @Test
    void issuedTokenCarriesUserIdAndRoleAndIsAcceptedByDecoder() {
        User user = user(Role.ADMIN);

        IssuedToken token = tokenService.issue(user);
        Jwt jwt = config.jwtDecoder(key, properties).decode(token.value());

        assertThat(jwt.getSubject()).isEqualTo(user.getId().toString());
        assertThat(jwt.getClaimAsString(JwtTokenService.ROLE_CLAIM)).isEqualTo("ADMIN");
        assertThat(jwt.getClaimAsString(JwtTokenService.EMAIL_CLAIM)).isEqualTo("admin@rentacar.com");
        assertThat(jwt.getClaimAsString("iss")).isEqualTo("rentacar");
        assertThat(jwt.getExpiresAt()).isAfter(Instant.now().plus(Duration.ofMinutes(119)));
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        IssuedToken token = tokenService.issue(user(Role.CUSTOMER));

        JwtProperties otherProperties = new JwtProperties(OTHER_SECRET, Duration.ofHours(2), "rentacar");
        JwtDecoder otherDecoder = config.jwtDecoder(config.jwtSecretKey(otherProperties), otherProperties);

        assertThatThrownBy(() -> otherDecoder.decode(token.value())).isInstanceOf(JwtException.class);
    }

    @Test
    void tooShortSecretIsRefusedAtStartup() {
        JwtProperties weak = new JwtProperties("c2hvcnQ=", Duration.ofHours(2), "rentacar");

        assertThatThrownBy(() -> config.jwtSecretKey(weak)).isInstanceOf(IllegalStateException.class);
    }

    private static User user(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("admin@rentacar.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        return user;
    }
}