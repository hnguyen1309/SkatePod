package com.skatepod.api.common;

import java.util.UUID;

/** Thrown when a requested record doesn't exist. Turned into a 404 by {@link ApiExceptionHandler}. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String type, UUID id) {
        super(type + " " + id + " was not found");
    }
}
