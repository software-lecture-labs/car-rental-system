package com.rentacar.rentalsystem.auth;

import com.rentacar.rentalsystem.exception.ResourceNotFoundException;
import com.rentacar.rentalsystem.security.JwtTokenService;
import com.rentacar.rentalsystem.user.User;
import com.rentacar.rentalsystem.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService tokenService;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // e-postalar küçük harfle saklanıyor (CustomerRegisterRequest)
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        // Kullanıcı yok ya da şifre yanlış: ikisinde de aynı mesaj (hangi e-postanın kayıtlı olduğu sızmasın)
        User user = userRepository.findByEmail(email)
                .filter(found -> passwordEncoder.matches(request.password(), found.getPassword()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        return LoginResponse.of(user, tokenService.issue(user));
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String userId) {
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}