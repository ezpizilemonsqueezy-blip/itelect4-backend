# Itelect4 Backend

Standalone Express, TypeScript, and MongoDB API for the Campus Recovery Desk lost-and-found app.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env`, then set `MONGODB_URI`, a long random `JWT_SECRET`, and optionally `GEMINI_API_KEY` from Google AI Studio. Keep the Gemini key in the backend environment; never add it to the frontend.
3. For MongoDB Atlas, create a project and cluster, add a database user, and allow your network IP (or `0.0.0.0/0` temporarily for development). In Atlas, choose **Connect > Drivers**, copy the URI, replace `<username>`, `<password>`, `<cluster-host>`, and `<database>`, then set it as `MONGODB_URI` in `.env`. URL-encode special characters in the database password.
4. Set `CORS_ORIGIN` to a comma-separated list of frontend origins allowed to call the API, e.g. `http://localhost:5173,https://your-frontend.vercel.app` (no trailing slash). Requests from any other origin are refused.
5. Run `npm run seed` once to load the item categories.
6. Run `npm run dev` for development or `npm run build` followed by `npm start` for production.

The API listens on port 4000 by default. Health check: `GET /api/health` returns `{ "status": "ok", "db": true }` when MongoDB is connected.

## Deploying to Vercel

`src/app.ts` exports the Express app as its default export, and the database connection is opened by a middleware on the first request, so Vercel can run it as a function. Import the repository in Vercel and set `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (and `GEMINI_API_KEY` for AI reviews) as environment variables. The Atlas IP access list must include `0.0.0.0/0`, because Vercel functions do not have fixed IPs.

## Endpoints

- `GET /api/categories` and `GET /api/categories/:id` are public and return the reference categories (`id`, `name`, `description`) that the item form's dropdown reads.
- `POST /api/auth/register` accepts `{ "name", "email", "password" }` and always assigns the `student` role.
- `POST /api/auth/login` accepts `{ "email", "password" }` and returns a two-hour bearer token and user.
- `GET /api/items` and `GET /api/items/:id` are public so anyone can browse recovered items. `POST /api/items` and `PATCH|DELETE /api/items/:id` require `Authorization: Bearer <token>` and operate only on the authenticated user's items.
- `GET|POST /api/claims` and `PATCH /api/claims/:id` require a bearer token. `GET` returns the claims you submitted plus the claims on items you logged. `POST` takes `{ "itemId", "claimantName", "email" }` and always starts as `Pending`. `PATCH` takes `{ "status": "Approved" | "Rejected" }` and is allowed only for the owner of the claimed item, once.
- `POST /api/ai` requires `Authorization: Bearer <token>` and `{ "prompt": "..." }` (20–2000 trimmed characters). It returns a checked review with `summary`, `strengths`, `improvements`, and `readiness` (`ready`, `almost`, or `not-yet`). Each user is limited to five requests per minute per API instance. Add `VITE_API_URL=http://localhost:4000` to the frontend environment if the API is not at its default URL.

Item fields are `name`, `category`, `status`, `location`, `description`, `estimatedValue`, and optional `foundAt`. `name`, `location`, and `description` are trimmed required strings; `category` must be one of `Electronics`, `Accessories`, `Documents`, or `Personal`; `status` must be one of `Recovered`, `Claimed`, or `Awaiting Pickup`; `estimatedValue` defaults to 0 and ranges from 0 to 100000 when provided.
