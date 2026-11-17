# Devbook

A full-stack social platform where developers share ideas, project updates and images. Built with React, Express, PostgreSQL and TypeScript.

![Devbook Feed Screenshot](./frontend/src/assets/feed.png)
![Devbook Create Post Screenshot](./frontend/src/assets/post.png)
![Devbook Edit Post Screenshot](./frontend/src/assets/edit.png)

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API overview](#api-overview)
- [Security](#security)
- [Deployment](#deployment)
- [Known limitations and roadmap](#known-limitations-and-roadmap)
- [Why I built it](#why-i-built-it)
- [License](#license)

## Features

- **Accounts:** register, log in and log out. Sessions use 15-minute access tokens and rotating refresh tokens in HttpOnly cookies. Refresh sessions have a rolling 30-day expiry.
- **Posts:** share text, an image, or both, with an optional title.
- **Image uploads:** JPEG, PNG and WebP files up to 5 MB, checked by file content and stored on ImageKit.
- **Post management:** authors can edit the title and text of their posts, or delete them. Deleting a post also removes its image from ImageKit.
- **Shared feed:** infinite scroll, loading skeletons and relative timestamps ("2 hours ago").
- **Interface:** responsive layout, dark and light themes, accessible forms and dialogs.
- **Roles:** the API supports role-based access control (`USER` and `ADMIN`).

## Tech stack

| Area     | Tools                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui (Base UI), React Router, TanStack Query, React Hook Form, Zod |
| Backend  | Node.js, Express 5, TypeScript, Zod, Multer, Argon2, jose (JWT), Helmet, express-rate-limit                  |
| Database | PostgreSQL with Prisma 7                                                                                     |
| Media    | ImageKit                                                                                                     |

## Getting started

### Prerequisites

- Node.js 20.19+ or 22.12+
- A PostgreSQL database
- An [ImageKit](https://imagekit.io) account (you need the private API key)

### 1. Clone the repository

```bash
git clone https://github.com/oussama-dalhi/devbook.git
cd devbook
```

### 2. Start the backend

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment variables](#environment-variables)), then:

```bash
npm run db:migrate   # creates the database tables
npm run dev
```

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

In development, Vite proxies requests from `/api` to the backend on port 3000, so no CORS setup is needed.

## Environment variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/devbook"
JWT_SECRET="replace-with-a-random-string-of-at-least-32-characters"
IMAGEKIT_PRIVATE_KEY="your-imagekit-private-key"
```

| Variable               | Required                | Description                                                                 |
| ---------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`         | Yes                     | PostgreSQL connection string                                               |
| `JWT_SECRET`           | Yes                     | Random secret of at least 32 characters used to sign access tokens         |
| `IMAGEKIT_PRIVATE_KEY` | Yes                     | Private API key from your ImageKit dashboard                               |
| `NODE_ENV`             | In production           | Set to `production` so cookies are sent only over HTTPS                    |
| `TRUST_PROXY`          | Behind a reverse proxy  | Number of proxies in front of the API (for example `1`), for correct client IPs and rate limiting |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Never commit `.env` files.

## Scripts

**Backend** (`backend/`)

| Command               | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start the API with automatic restarts                  |
| `npm run build`       | Generate the Prisma client and compile TypeScript      |
| `npm start`           | Run the compiled server from `dist/`                   |
| `npm run typecheck`   | Type-check without emitting files                      |
| `npm run db:migrate`  | Create and apply a migration in development            |
| `npm run db:deploy`   | Apply existing migrations (production)                 |
| `npm run db:generate` | Regenerate the Prisma client                           |

**Frontend** (`frontend/`)

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the Vite development server      |
| `npm run build`   | Type-check and build for production    |
| `npm run lint`    | Run ESLint                             |
| `npm run preview` | Preview the production build           |

## Project structure

```text
devbook/
├── backend/
│   ├── prisma/          # Prisma schema and SQL migrations
│   └── src/
│       ├── db/              # Prisma client setup
│       ├── lib/             # ImageKit client
│       ├── middleware/      # authentication, authorization, uploads, rate limits, errors
│       ├── routes/          # auth, posts, admin
│       ├── types/           # Express type extensions
│       └── utils/           # JWT, passwords, images, HTTP errors
└── frontend/                # Vite app and frontend configuration
    ├── public/              # favicon and theme initialization
    └── src/
        ├── assets/          # screenshots and image assets
        ├── components/      # layout, shared components, UI primitives
        ├── features/
        │   ├── auth/        # registration, login, session state
        │   └── posts/       # feed, post forms, post API and types
        └── lib/             # API client, query keys, formatting, helpers
```

## API overview

All routes are under `/api`. Routes marked "Auth" need a valid access-token cookie. The refresh route uses the refresh-token cookie.

| Method | Route              | Access             | Description                                                |
| ------ | ------------------ | ------------------ | ---------------------------------------------------------- |
| POST   | `/auth/register`   | Public             | Create an account                                          |
| POST   | `/auth/login`      | Public             | Log in and set access and refresh cookies                  |
| POST   | `/auth/refresh`    | Refresh cookie     | Rotate the refresh token and issue a new access token      |
| POST   | `/auth/logout`     | Public             | Revoke the refresh session and clear auth cookies          |
| GET    | `/auth/me`         | Auth               | Get the current user                                       |
| GET    | `/posts`           | Public             | Get the paginated feed (`page`, `limit`)                   |
| GET    | `/posts/:postId`   | Public             | Get one post                                               |
| POST   | `/posts`           | Auth               | Create a post (`multipart/form-data`: `title`, `content`, optional `image`) |
| PATCH  | `/posts/:postId`   | Auth, author        | Edit the title or content of your post                     |
| DELETE | `/posts/:postId`   | Auth, author        | Delete your post and its stored image                      |
| GET    | `/admin/dashboard` | Auth, admin         | Get the role-protected admin response                      |

The server also exposes `GET /health` for uptime checks.

## Security

- Passwords are hashed with **Argon2**. Login does the same hashing work for unknown accounts, so response timing does not reveal which usernames exist.
- Access tokens are **JWTs (HS256, algorithm pinned) that expire after 15 minutes**, stored in `HttpOnly`, `SameSite=Strict` cookies (`Secure` in production).
- Account and post inputs, including feed pagination, are validated with **Zod**.
- Post updates and deletes are scoped to the author in the database query, so users can only change their own posts.
- Uploads are limited by size, declared type and **actual file content**, and are stored under random file names.
- **Rate limits** apply to login, registration and post creation, and **Helmet** sets security headers.

## Deployment

1. **Serve the frontend and the API from the same domain,** with `/api` routed to Express. The session cookie is `SameSite=Strict`, and the Vite proxy exists only in development.
2. Set `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` and `IMAGEKIT_PRIVATE_KEY` on the server. If a reverse proxy sits in front of the API, also set `TRUST_PROXY` (usually `1`). Without it, rate limiting sees every visitor as one IP address.
3. Build and start the API:

   Use `npm run db:deploy` to apply migrations in production. Do not run `migrate dev` there.

   ```bash
   cd backend
   npm ci
   npm run build
   npm run db:deploy
   npm start
   ```
4. Build the frontend with `npm run build` in `frontend/` and serve the `dist/` folder.

## Known limitations and roadmap

Current limitations:

- An image cannot be replaced after a post is published.
- A title or text can be edited but not cleared.
- There are no automated tests yet.

Planned:

- [ ] User profile pages
- [ ] Comments and likes
- [ ] Cursor-based pagination for the feed
- [ ] Automated tests and a CI pipeline

## Why I built it

I built Devbook to improve my full-stack skills and to create a place where developers can share their work and ideas.

Along the way I learned how to:

- build cookie-based authentication with short-lived JWTs;
- validate data on both the client and the server with Zod;
- design and migrate a PostgreSQL schema with Prisma;
- handle secure image uploads and keep ImageKit and the database in sync;
- build an infinite-scrolling feed with TanStack Query.

Devbook is an ongoing project, and I plan to keep adding features.

## License

Released under the ISC license.
