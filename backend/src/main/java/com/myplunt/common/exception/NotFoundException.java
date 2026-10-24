package com.myplunt.common.exception;

// Its message goes to the client as the 404 detail, so keep it user-safe ("Plant not found").
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
