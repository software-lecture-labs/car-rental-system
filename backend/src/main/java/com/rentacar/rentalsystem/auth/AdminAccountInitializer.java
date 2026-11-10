package com.rentacar.rentalsystem.auth;

import com.rentacar.rentalsystem.user.Role;
import com.rentacar.rentalsystem.user.User;
import com.rentacar.rentalsystem.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Uygulama açılırken, app.admin.email ile kayıtlı kullanıcı yoksa bir ADMIN hesabı oluşturur.
 * Admin ayrı tablo değil: sadece users tablosunda role = 'ADMIN' olan bir satır.
 * app.admin.* ayarları yoksa (ör. gerçek ortamda verilmemişse) hiçbir şey yapmaz.
 */
@Component
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public AdminAccountInitializer(UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   @Value("${app.admin.email:}") String adminEmail,
                                   @Value("${app.admin.password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.info("app.admin.email / app.admin.password not set, skipping admin account creation.");
            return;
        }

        String email = adminEmail.trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }

        User admin = new User();
        admin.setFirstName("Sistem");
        admin.setLastName("Yoneticisi");
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        log.info("Admin account created: {}", email);
    }
}