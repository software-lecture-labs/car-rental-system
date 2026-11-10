package com.rentacar.rentalsystem.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Kim hangi endpoint'e erişebilir?
 * - Herkes: giriş, kayıt, araç listesi/detayı/arama, fiyat kademeleri
 * - Sadece ADMIN: araç ve fiyat yönetimi, müşteri listesi/silme, tüm kiralamalar, teslim alma / iade / geri alma
 * - Giriş yapmış herkes: geri kalanlar. Müşterinin sadece KENDİ verisine erişmesi controller'lardaki @PreAuthorize ile sağlanır.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource)
            throws Exception {

        AuthenticationEntryPoint unauthorized = (request, response, ex) -> writeProblem(response,
                HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required or the token is invalid.",
                request.getRequestURI());
        AccessDeniedHandler forbidden = (request, response, ex) -> writeProblem(response,
                HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to perform this action.",
                request.getRequestURI());

        http
                // Token Authorization başlığında taşınıyor, cookie yok: CSRF koruması gereksiz
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                // Sunucu oturum tutmaz, her istek kendi token'ını getirir
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/customers/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/cars", "/api/cars/available", "/api/cars/{id}",
                                "/api/pricing/policies").permitAll()

                        .requestMatchers("/api/cars/**", "/api/pricing/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/customers", "/api/customers/email/**",
                                "/api/customers/search/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/customers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/rentals", "/api/rentals/car/**",
                                "/api/rentals/status/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/rentals/*/pickup", "/api/rentals/*/return",
                                "/api/rentals/*/rollback").hasRole("ADMIN")

                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(unauthorized)
                        .accessDeniedHandler(forbidden))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(unauthorized)
                        .accessDeniedHandler(forbidden));

        return http.build();
    }

    /** Frontend'in (Next.js) başka bir porttan istek atabilmesi için. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:3000}") List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /** Token'daki "role" claim'i (ADMIN / CUSTOMER) -> ROLE_ADMIN / ROLE_CUSTOMER yetkisi. */
    private static JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName(JwtTokenService.ROLE_CLAIM);
        authorities.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }

    /** 401 / 403 cevapları da diğer hatalar gibi ProblemDetail formatında olsun. */
    private static void writeProblem(HttpServletResponse response, HttpStatus status, String title,
                                     String detail, String instance) throws IOException {
        if (status == HttpStatus.UNAUTHORIZED) {
            response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        }
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("""
                {"title":"%s","status":%d,"detail":"%s","instance":"%s"}"""
                .formatted(title, status.value(), detail, instance));
    }
}