package com.myplunt.constants;

public final class ApiPaths {

    private ApiPaths() {}

    public static final class Admin {
        public static final String BASE = "/v1/admin";
        public static final String AUTH = BASE + "/auth";
        public static final String LOGIN = AUTH + "/login";
        public static final String REFRESH = AUTH + "/refresh";
        public static final String LOGOUT = AUTH + "/logout";
        public static final String ME = BASE + "/me";
        public static final String LOGS = BASE + "/logs";
        public static final String LOGS_OVERVIEW = LOGS + "/overview";
        public static final String SERVER = BASE + "/server";
        public static final String SPECIES = BASE + "/species";
        public static final String PENDING_SPECIES = SPECIES + "/pending";
        public static final String PENDING_SPECIES_BY_ID = PENDING_SPECIES + "/{id}";
        public static final String APPROVE_SPECIES = PENDING_SPECIES_BY_ID + "/approve";
        public static final String JOBS = BASE + "/jobs";
        public static final String RESET_DB = JOBS + "/reset-db";
        public static final String SEND_WEATHER_ALERTS = JOBS + "/send-weather-alerts";
        public static final String SKIP_DAY = JOBS + "/skip-day";
        public static final String PREVIEW_RAIN = JOBS + "/preview-rain";
        public static final String PREVIEW_WIND = JOBS + "/preview-wind";
        public static final String PREVIEW_SNOW = JOBS + "/preview-snow";

        private Admin() {}
    }

    public static final class ClientLogs {
        public static final String BASE = "/v1/client-logs";

        private ClientLogs() {}
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
        public static final String ME_AVATAR = ME + "/avatar";
        public static final String ME_LOCATION = ME + "/location";
        public static final String ME_ONBOARDING = ME + "/onboarding";
        public static final String ME_NOTIFICATIONS = ME + "/notifications";
        public static final String ME_PUSH_TOKEN = ME + "/push-token";
        public static final String ME_INBOX = ME + "/inbox";
        public static final String SEARCH = BASE + "/search";
        // Literal paths (/me, /search) win over this template.
        public static final String BY_ID = BASE + "/{userId}";
        public static final String GARDEN = BY_ID + "/garden";
        public static final String DISCOVERED_SPECIES = BY_ID + "/species/discovered";
        public static final String POSTS = BY_ID + "/posts";
        public static final String PLANT = BY_ID + "/plants/{plantId}";
        public static final String PLANT_PHOTOS = PLANT + "/photos";

        private Users() {}
    }

    public static final class Friends {
        public static final String BASE = "/v1/friends";
        public static final String REQUESTS = BASE + "/requests";
        // Keyed by the other user, so their profile can answer without knowing the request's id.
        public static final String ACCEPT = REQUESTS + "/{userId}/accept";
        public static final String DECLINE = REQUESTS + "/{userId}/decline";
        public static final String CANCEL = REQUESTS + "/{userId}/cancel";
        public static final String REMOVE = BASE + "/{userId}/remove";
        public static final String SITTERS = BASE + "/sitters";

        private Friends() {}
    }

    public static final class CareRequests {
        public static final String BASE = "/v1/care-requests";
        // Keyed by who asked, like friend requests: there's only ever one live request between two people.
        public static final String ACCEPT = BASE + "/{userId}/accept";
        public static final String DECLINE = BASE + "/{userId}/decline";
        public static final String CANCEL = BASE + "/{userId}/cancel";

        private CareRequests() {}
    }

    public static final class Garden {
        public static final String BASE = "/v1/garden";

        private Garden() {}
    }

    public static final class Plants {
        public static final String BASE = "/v1/plants";
        public static final String BY_ID = BASE + "/{plantId}";
        public static final String WATERINGS = BASE + "/{plantId}/waterings";
        public static final String PHOTOS = BASE + "/{plantId}/photos";
        public static final String PHOTO_BY_ID = PHOTOS + "/{photoId}";

        private Plants() {}
    }

    public static final class Waterings {
        public static final String BASE = "/v1/waterings";
        public static final String STREAK = BASE + "/streak";

        private Waterings() {}
    }

    public static final class Planters {
        public static final String BASE = "/v1/planters";
        public static final String BY_ID = BASE + "/{planterId}";

        private Planters() {}
    }

    public static final class Posts {
        public static final String BASE = "/v1/posts";
        public static final String FEED = BASE + "/feed";
        public static final String MINE = BASE + "/mine";
        public static final String BY_ID = BASE + "/{postId}";
        public static final String QUESTIONS = BASE + "/questions";
        public static final String COMMENTS = BY_ID + "/comments";
        public static final String WATER = BY_ID + "/water";

        private Posts() {}
    }

    public static final class Species {
        public static final String BASE = "/v1/species";
        public static final String DISCOVERED = BASE + "/discovered";

        private Species() {}
    }

    public static final class Weather {
        public static final String BASE = "/v1/weather";
        public static final String CURRENT = BASE + "/current";

        private Weather() {}
    }
}
