package com.rentacar.rentalsystem.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByEmail(String email);

    List<Customer> findByFirstNameContainingIgnoreCase(String firstName);

    List<Customer> findByLastNameContainingIgnoreCase(String lastName);

    List<Customer> findByLicenseYear(int licenseYear);
}