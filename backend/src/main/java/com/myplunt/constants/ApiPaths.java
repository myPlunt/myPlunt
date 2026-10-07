package com.myplunt.constants;

public final class ApiPaths {

    private ApiPaths() {}

    public static final class Greeting {
        public static final String BASE = "/v1/greeting";

        private Greeting() {}
    }

    public static final class Ops {
        public static final String RESET_DB = "/v1/ops/reset-db";

        private Ops() {}
    }
}