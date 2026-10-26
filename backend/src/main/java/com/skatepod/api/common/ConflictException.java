package com.skatepod.api.common;

/**
 * Thrown when a request clashes with data that's already saved, for example a lesson
 * booked over another lesson. Turned into a 409 Conflict by {@link ApiExceptionHandler}.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
