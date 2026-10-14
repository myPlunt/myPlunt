package com.myplunt.common.logging;

// Hides personal data before it goes into a log line, while keeping enough to tell values apart
// ("j***@old.com" vs "j***@new.com").
public final class LogMasking {

    private LogMasking() {}

    public static String email(String email) {
        if (email == null) {
            return null;
        }
        int at = email.indexOf('@');
        return at < 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }

    public static String username(String username) {
        if (username == null) {
            return null;
        }
        return username.isEmpty() ? "***" : username.charAt(0) + "***";
    }
}
