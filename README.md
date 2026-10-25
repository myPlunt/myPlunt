<p align="center"><img src="frontend/assets/images/Logo.png" alt="myPlunt logo" width="120"></p>

# myPlunt

## Description

myPlunt is a social plant-care app for Android and iOS. You keep a virtual garden, follow your friends' gardens, get watering reminders and weather alerts for each plant's location, and can hand your plants to a friend while you're away. The app's visuals follow the real weather.

It also has a PluntDex of regional plants, and a feed with posts or questions about your friends' plants (a new leaf, a broken watering streak, a first bloom).

The repository is a monorepo with four apps:

| Folder | What it is | Stack |
|---|---|---|
| `backend/` | REST API | Spring Boot 4, Java 25, PostgreSQL, Flyway, JWT |
| `frontend/` | Mobile app | Expo SDK 57, React Native, expo-router, TypeScript, NativeWind |
| `web_landing/` | Marketing site | Vite, React 19, Tailwind v4 |
| `admin_dashboard/` | Internal admin app | Vite, React 19, Tailwind v4 |

## Installation

Requirements: Java 25, Node.js with npm, Docker, and Xcode or Android Studio to run the app on a simulator or emulator.

```bash
git clone git@gitlab.com:saxionnl/hbo-ict/aad/2026-2027/11.git
cd 11
```

Each app has its own dependencies, so install them inside its folder:

```bash
cd frontend && npm install
cd ../web_landing && npm install
cd ../admin_dashboard && npm install
```

The backend uses the Maven wrapper (`./mvnw`), so it needs no separate install.

Environment files:
- `frontend/`: copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your backend.
- `admin_dashboard/`: copy `.env.example` to `.env.local` and set `VITE_API_URL`.

## Usage

```bash
# backend: starts the local Postgres through Docker and loads seed data
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# mobile app: press i for iOS or a for Android
cd frontend && npm start

# landing site
cd web_landing && npm run dev

# admin dashboard on http://localhost:5174
cd admin_dashboard && npm run dev
```

Local admin login: `admin@myplunt.dev` / `dev-admin-password`.

## Roadmap

- A community "cemetery" for plants that die
- Achievements
- Better UI/UX overall
- Admin dashboard: edit species and their groups, and take a species offline

## Contributing

1. Branch off `dev`: `feature/FMP-XXX-Short-description` or `technical/TMP-XXX-Short-description`.
2. Start commit messages with the ticket key, e.g. `FMP-004-Add user profile screen`.
3. Run the checks for every app you changed before opening a merge request:
   - backend: `./mvnw test` (needs Docker for `ApplicationTests`)
   - frontend: `npm run test:ci && npm run lint && npx tsc --noEmit`
   - web_landing and admin_dashboard: `npm run lint && npm run build`
4. Open the merge request against `dev`. `dev` deploys to staging and `main` to production.

GitLab CI runs the same checks on every merge request.

## Authors and acknowledgment

Built by Rafael Tavares and Egidijus Ukrinas

## Project status

In active development.
