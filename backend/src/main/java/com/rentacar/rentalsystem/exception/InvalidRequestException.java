package com.rentacar.rentalsystem.exception;

/**
 * The request contains a value the service cannot accept (e.g. unknown pricing package,
 * too few days for the selected package). Mapped to 400 Bad Request.
 */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
