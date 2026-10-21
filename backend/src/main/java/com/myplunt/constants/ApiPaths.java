package com.myplunt.constants;

public final class ApiPaths {

    private ApiPaths() {}

    public static final class Ops {
        public static final String RESET_DB = "/v1/ops/reset-db";

        private Ops() {}
    }

    // The admin dashboard's API. Its own security chain (AdminSecurityConfig): only admin tokens work here.
    public static final class Admin {
        public static final String BASE = "/v1/admin";
        public static final String AUTH = BASE + "/auth";
        public static final String LOGIN = AUTH + "/login";
        public static final String REFRESH = AUTH + "/refresh";
        public static final String LOGOUT = AUTH + "/logout";
        public static final String ME = BASE + "/me";
        public static final String LOGS = BASE + "/logs";
        public static final String LOGS_OVERVIEW = LOGS + "/overview";
        public static final String SPECIES = BASE + "/species";
        public static final String PENDING_SPECIES = SPECIES + "/pending";
        public static final String PENDING_SPECIES_BY_ID = PENDING_SPECIES + "/{id}";
        public static final String APPROVE_SPECIES = PENDING_SPECIES_BY_ID + "/approve";

        private Admin() {}
    }

    // What the app logs (actions, warnings, errors), stored in the logs table.
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
        // PUT sets the profile picture from an uploaded key, DELETE removes it.
        public static final String ME_AVATAR = ME + "/avatar";
        // PUT saves the city the user shared during onboarding.
        public static final String ME_LOCATION = ME + "/location";
        // PUT marks the app tour as finished or skipped.
        public static final String ME_ONBOARDING = ME + "/onboarding";
        // GET returns, PUT replaces which kinds of notifications the user wants.
        public static final String ME_NOTIFICATIONS = ME + "/notifications";
        public static final String SEARCH = BASE + "/search";
        // Literal paths (/me, /search) win over this template.
        public static final String BY_ID = BASE + "/{userId}";

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

        private Friends() {}
    }

    public static final class Garden {
        public static final String BASE = "/v1/garden";

        private Garden() {}
    }

    public static final class Plants {
        public static final String BASE = "/v1/plants";
        public static final String BY_ID = BASE + "/{plantId}";
        // POST waters the plant, GET returns its watering history.
        public static final String WATERINGS = BASE + "/{plantId}/waterings";
        // POST adds a growth photo, GET returns them all, oldest first.
        public static final String PHOTOS = BASE + "/{plantId}/photos";
        // PUT changes a growth photo's date and note, DELETE removes it.
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
        // The signed-in user's and their friends' posts, newest first.
        public static final String FEED = BASE + "/feed";
        // The signed-in user's own posts, newest first (for their profile).
        public static final String MINE = BASE + "/mine";
        // GET opens a post of the user's or a friend's; PUT edits the user's own post's text, DELETE removes it.
        public static final String BY_ID = BASE + "/{postId}";
        // POST asks the user's friends a question; it shows up in the feed as a sticky note.
        public static final String QUESTIONS = BASE + "/questions";

        private Posts() {}
    }

    public static final class Species {
        public static final String BASE = "/v1/species";
        public static final String DISCOVERED = BASE + "/discovered";

        private Species() {}
    }
}
