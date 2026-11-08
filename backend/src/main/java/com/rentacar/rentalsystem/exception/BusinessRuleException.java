package com.rentacar.rentalsystem.exception;

/**
 * The request is valid, but it conflicts with the current state of the system
 * (e.g. insufficient balance, car not available, duplicate plate). Mapped to 409 Conflict.
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
