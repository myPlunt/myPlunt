package com.myplunt.constants;

public final class ApiPaths {

    private ApiPaths() {}

    public static final class Ops {
        public static final String RESET_DB = "/v1/ops/reset-db";

        private Ops() {}
    }

    public static final class Photos {
        public static final String BASE = "/v1/photos";
        public static final String UPLOAD_URL = BASE + "/upload-url";
        public static final String CONFIRM = BASE + "/confirm";

        private Photos() {}
    }

    public static final class Auth {
        public static final String BASE = "/v1/auth";
        public static final String REGISTER = BASE + "/register";
        public static final String LOGIN = BASE + "/login";
        public static final String LOGOUT = BASE + "/logout";
        public static final String REFRESH = BASE + "/refresh";

        private Auth() {}
    }

    public static final class Users {
        public static final String BASE = "/v1/users";
        public static final String ME = BASE + "/me";
        public static final String ME_EMAIL = ME + "/email";

        private Users() {}
    }

    public static final class Garden {
        public static final String BASE = "/v1/garden";

        private Garden() {}
    }

    public static final class Plants {
        public static final String BASE = "/v1/plants";
        public static final String WATERINGS = BASE + "/{plantId}/waterings";

        private Plants() {}
    }

    public static final class Species {
        public static final String BASE = "/v1/species";

        private Species() {}
    }
}
