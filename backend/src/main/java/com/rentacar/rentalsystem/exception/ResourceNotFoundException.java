package com.rentacar.rentalsystem.exception;

/**
 * The requested resource (car, customer, rental, pricing policy...) does not exist. Mapped to 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
