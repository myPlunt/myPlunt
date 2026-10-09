package com.myplunt.constants;

public final class ApiPaths {

    private ApiPaths() {}

    public static final class Ops {
        public static final String RESET_DB = "/v1/ops/reset-db";

        private Ops() {}
    }

    public static final class Auth {
        public static final String BASE = "/v1/auth";
        public static final String REGISTER = BASE + "/register";
        public static final String LOGIN = BASE + "/login";
        public static final String LOGOUT = BASE + "/logout";
        public static final String REFRESH = BASE + "/refresh";

        private Auth() {}
    }
}