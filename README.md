# Itelect4 Backend

Standalone Express, TypeScript, and MongoDB API for the Campus Recovery Desk lost-and-found app.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env`, then set `MONGODB_URI`, a long random `JWT_SECRET`, and `GEMINI_API_KEY` from Google AI Studio. Keep the Gemini key in the backend environment; never add it to the frontend.
3. Run `npm run dev` for development or `npm run build` followed by `npm start` for production.

The API listens on port 4000 by default. Health check: `GET /api/health`.

## Endpoints

- `POST /api/auth/register` accepts `{ "name", "email", "password" }` and always assigns the `student` role.
- `POST /api/auth/login` accepts `{ "email", "password" }` and returns a two-hour bearer token and user.
- `GET|POST /api/items` and `GET|PATCH|DELETE /api/items/:id` require `Authorization: Bearer <token>` and operate only on the authenticated user's items.
- `POST /api/ai` requires `Authorization: Bearer <token>` and `{ "prompt": "..." }` (20–2000 trimmed characters). It returns a checked review with `summary`, `strengths`, `improvements`, and `readiness` (`ready`, `almost`, or `not-yet`). Each user is limited to five requests per minute per API instance. Add `VITE_API_URL=http://localhost:4000` to the frontend environment if the API is not at its default URL.

Item fields are `name`, `category`, `status`, `location`, `description`, `estimatedValue`, and optional `foundAt`. `name`, `location`, and `description` are trimmed required strings; `category` must be one of `Electronics`, `Accessories`, `Documents`, or `Personal`; `status` must be one of `Recovered`, `Claimed`, or `Awaiting Pickup`; `estimatedValue` defaults to 0 and ranges from 0 to 100000 when provided.
