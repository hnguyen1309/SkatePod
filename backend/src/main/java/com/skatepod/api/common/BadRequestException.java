package com.skatepod.api.common;

/** Thrown when a request breaks a business rule. Turned into a 400 by {@link ApiExceptionHandler}. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
