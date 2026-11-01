# Devbook — Project Notes, Decisions, Issues, and Full-Stack Setup Guide

_Last consolidated: 1 November 2026_

This document records the Devbook project setup and the learning decisions made so far. It also provides a repeatable setup guide for starting a similar React + TypeScript / Express + TypeScript / PostgreSQL / Prisma project on Windows.

> **Learning-project rule:** build features in small steps. Understand the purpose of each dependency and configuration file before adding more tools. Avoid creating abstractions, tests, or infrastructure before there is a concrete need for them.

---

# Part I — Devbook so far

## 1. Product idea and audience

**Devbook** is a community platform for developers to:

- Share milestones and development progress.
- Publish ideas.
- Showcase what they are building.
- Connect with other developers.

It is not intended to be a programming Q&A site or simply another generic social-media clone. The emphasis is on sharing a developer's journey and building connections.

### Product and repository naming

| Item | Current name |
|---|---|
| Product | Devbook |
| Local project folder | `devbook` |
| GitHub repository | `devbook` (private, as decided) |
| Backend npm package | `devbook-api` |
| PostgreSQL database | `devbook` |

The repository is a **monorepo**: one Git repository contains the frontend and backend applications.

## 2. Technology stack and environment

The versions below are the versions reported or used during this project setup. They are a record of the working environment, not a claim that they are the newest releases.

| Area | Technology / version used |
|---|---|
| Operating system | Windows |
| Terminal | Git Bash (MINGW64) |
| Runtime | Node.js `v24.22.1` |
| Package manager | npm `11.21.0` |
| Git | `2.53.0.windows.1` |
| Backend | Express `5.x`, TypeScript |
| TypeScript | `7.0.2` |
| Frontend | React + TypeScript + Vite |
| Database | PostgreSQL 18 |
| ORM | Prisma `7.10.1` |
| PostgreSQL driver | `pg` |
| Prisma adapter | `@prisma/adapter-pg` `7.10.1` |
| Request validation | Zod |
| Password hashing | `argon2` (Argon2id default) |

### Version note for future projects

This project deliberately uses Prisma 7.10.1. Prisma's documentation now also advertises Prisma 8 as the current major release, while retaining a Prisma 7 documentation set. For a new project, check the current major version and follow that version's guide consistently. Do not mix a Prisma 8 CLI with Prisma 7 client/adapter packages or copy configuration from different major versions. To reproduce this project exactly, use matching Prisma 7 package versions and the Prisma 7 guide.

## 3. Repository structure

The main layout is:

```text
devbook/
├── .gitignore
├── .prettierrc.json              # Root-level formatting preferences
├── README.md
├── frontend/                     # React + TypeScript + Vite
└── backend/
    ├── prisma/
    │   ├── migrations/
    │   │   ├── <initial-migration>/
    │   │   │   └── migration.sql
    │   │   └── 20261101004750_update_user_and_post_models/
    │   │       └── migration.sql
    │   └── schema.prisma
    ├── src/
    │   ├── db/
    │   │   └── prisma.ts
    │   ├── generated/
    │   │   └── prisma/            # Generated Prisma Client; ignored by Git
    │   ├── routes/
    │   │   └── auth.ts
    │   ├── utils/
    │   │   └── password.ts
    │   ├── app.ts
    │   └── server.ts
    ├── .env                       # Local secrets; ignored by Git
    ├── package.json
    ├── package-lock.json
    ├── prisma7.config.ts
    └── tsconfig.json
```

The frontend is currently scaffolded, but the work so far has concentrated on backend foundations and registration. The structure can evolve as features are added. Do not create every possible folder in advance; add folders when the application needs them.

## 4. Git and repository decisions

- The GitHub repository is intended to remain private while the project is being developed.
- The local branch shown during the recent checks was `main`, tracking `origin/main`.
- Commits have been used as milestones rather than waiting for the entire application to be finished.
- Changes should be grouped by purpose. For example, configuration changes can be one commit and schema/migration changes another.
- Before using `git add .`, inspect `git status` to avoid staging `.env`, local generated output, or unrelated files.

A useful commit naming style used in this project:

```text
chore: refine backend configuration
feat: update user and post models
feat: implement user registration
```

The exact status of the latest registration and password-utility changes should be checked with `git status`; do not assume every latest change has already been committed or pushed.

---

# Part II — Database and Prisma

## 5. Database setup

A PostgreSQL database named `devbook` was created using pgAdmin. The old `social_post` database was retained during the transition so that the new setup could be verified first. The conversation does not confirm that `social_post` was eventually dropped.

The backend's `DATABASE_URL` points to the local `devbook` database on port `5432`. The real connection string and password belong only in the local `backend/.env` file. Never copy a real password into this document, source code, README, terminal screenshots, or Git history.

### PostgreSQL command-line tools were not on PATH

These commands failed in Git Bash:

```bash
psql -U postgres
createdb -U postgres devbook
```

The error was `bash: psql: command not found` / `bash: createdb: command not found`.

That only showed that Git Bash could not find those command-line tools; it did not prove that PostgreSQL was missing. pgAdmin was available, so the database was created through:

1. Open pgAdmin and connect to the PostgreSQL server.
2. Right-click **Databases**.
3. Choose **Create → Database**.
4. Set the database name to `devbook` and the owner to `postgres` (the account used in this setup).
5. Save.

If `psql` or `createdb` are needed in another environment, install/add the PostgreSQL `bin` directory to PATH or use the SQL Shell. For this Windows setup, pgAdmin was the straightforward option.

### Changing the PostgreSQL password

The password field is on the PostgreSQL **Login/Group Role** properties, not the database properties:

1. Expand the server in pgAdmin.
2. Expand **Login/Group Roles**.
3. Right-click the `postgres` role and open **Properties**.
4. Open **Definition** and set the password.
5. Save, then update the password in `backend/.env`.

A SQL alternative, when connected with sufficient privileges, is:

```sql
ALTER ROLE postgres WITH PASSWORD 'your-new-password';
```

Use a strong unique password. Do not put the actual password in this document or share it in chat.

### URL-encoding passwords

A PostgreSQL connection string is a URL. Reserved characters inside the password must be percent-encoded so they are not mistaken for URL syntax. For example:

| Character in the actual password | Encoded in `DATABASE_URL` |
|---|---|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `/` | `%2F` |
| `:` | `%3A` |
| `?` | `%3F` |

The `@` separating credentials from the host is still a literal `@`. For example, if the actual password ends in `@`, the URL contains `%40@localhost...`: `%40` is the encoded password character, and the following `@` separates credentials from the host.

pgAdmin's password field expects the **actual password**, not the encoded representation. Prisma reads the URL and decodes it as part of URL parsing.

There was a period when pgAdmin password authentication failed even though Prisma had previously connected. A clipboard command also failed in Git Bash with `stdout is not a tty`. Closing and reopening pgAdmin eventually restored access. The exact root cause was not conclusively established, so do not assume the clipboard command fixed it. The important verification was that pgAdmin later displayed the `User` table and its records.

## 6. Prisma concepts learned

These concepts are related but not interchangeable:

- **`schema.prisma`** is the blueprint: models, fields, relations, indexes, and database provider.
- **Prisma Client** is generated TypeScript/JavaScript code that provides the type-safe query API.
- **A Prisma Client instance** is the object created with `new PrismaClient(...)` and used by application code to execute queries.
- **Prisma Migrate** creates and applies versioned changes to the actual database structure.

Useful commands:

| Command | Purpose |
|---|---|
| `npx prisma format` | Format `schema.prisma` |
| `npx prisma validate` | Validate the Prisma schema |
| `npx prisma migrate dev --name <description>` | Create/apply a development migration |
| `npx prisma generate` | Generate the Prisma Client |
| `npx prisma migrate status` | Check migration status |
| `npx prisma studio` | Open Prisma's visual data browser (optional) |

In the Prisma 7 workflow used here, `migrate dev` and `generate` were run as separate steps. Do not assume that applying a migration automatically regenerated the client.

## 7. Current Prisma schema design

The schema evolved during review:

- `PostType` was explicitly removed. Posts are not classified by a database enum.
- `isActive` was removed because account deactivation/suspension is not part of the current MVP.
- The primary keys were standardized to `id` instead of `user_id` / `post_id`.
- `User.name` was added as a required display name.
- `Post.title` was added as an optional field.
- `authorId` references `User.id`.
- The post indexes were kept because the anticipated feed and profile queries need ordering by creation time.

The final schema established by the generated migration has these main concepts:

### `Role`

```prisma
enum Role {
  USER
  ADMIN
}
```

The role defaults to `USER`. Public registration must not let a client choose `ADMIN`.

### `User`

| Field | Purpose |
|---|---|
| `id` | Auto-incrementing primary key |
| `name` | Required display name, max 100 characters |
| `username` | Unique username, max 30 characters |
| `email` | Unique email, max 254 characters |
| `passwordHash` | Stored Argon2id hash, never plaintext |
| `role` | `USER` or `ADMIN`, defaults to `USER` |
| `createdAt` | Creation timestamp |
| `updatedAt` | Automatically updated timestamp |
| `posts` | One-to-many relationship to posts |

### `Post`

| Field | Purpose |
|---|---|
| `id` | Auto-incrementing primary key |
| `title` | Optional title, max 100 characters |
| `content` | Optional content, max 500 characters |
| `imageUrl` | Optional image URL, max 2048 characters |
| `createdAt` | Creation timestamp |
| `updatedAt` | Automatically updated timestamp |
| `authorId` | Foreign key to the user |
| `author` | Relation to `User` |

Relevant indexes:

```prisma
@@index([authorId, createdAt])
@@index([createdAt])
```

The relation uses `onDelete: Cascade`: permanently deleting a user deletes their posts. Deactivating a user was discussed, but `isActive` was removed from the current MVP schema.

### Validation caveat for posts

`title`, `content`, and `imageUrl` are optional in the database. Therefore, the database permits a post with all three missing. The backend should enforce a product rule that a post contains at least a title, meaningful content, or an image (depending on the final product requirements).

## 8. Migration history and warning messages

The database has two migrations, and `npx prisma migrate status` reported:

```text
2 migrations found in prisma/migrations
Database schema is up to date!
```

The initial migration created the original `User` and `Post` tables. It included `isActive` on `User` and did not yet include `name` or `title`.

The second migration, named:

```text
20261101004750_update_user_and_post_models
```

contained SQL equivalent to:

```sql
ALTER TABLE "Post"
ADD COLUMN "title" VARCHAR(100);

ALTER TABLE "User"
DROP COLUMN "isActive",
ADD COLUMN "name" VARCHAR(100) NOT NULL;
```

Prisma printed warnings:

- Dropping `isActive` loses values in that column.
- Adding required `name` without a default cannot succeed against a non-empty table that already has rows.

This was acceptable because the new development database had no application data to preserve. In a populated database, plan a safe backfill: add the new field as nullable or with a temporary default, populate existing rows, then enforce `NOT NULL` in a later migration.

**Do not edit or delete old migration files just because the schema changes.** Migrations are the database's version history. Add a new migration for later schema changes. Only reset an empty, disposable development database when you understand the consequences and deliberately choose to do so.

## 9. Prisma 7 configuration and connection

### Generator in `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

The output path resolves to `backend/src/generated/prisma/` because it is relative to the Prisma schema directory.

Prisma 7 puts the connection URL in the Prisma config rather than inside the schema's `datasource` block.

### Prisma CLI config in the backend root

The project used `prisma7.config.ts` and the CLI confirmed it loaded that file:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

The conventional filename in Prisma's examples is `prisma.config.ts`. The project's `prisma7.config.ts` was detected successfully in the commands shown; there is no need to rename it solely for style. Keep the file name and CLI behavior consistent if copying this setup.

### Runtime Prisma instance: `src/db/prisma.ts`

The project uses the PostgreSQL driver adapter:

```ts
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
```

The environment-variable guard above is a recommended improvement discussed during review. The originally shared file created the adapter directly from `process.env.DATABASE_URL` and exported a shared client. Either way, use one shared Prisma Client instance for the long-running application rather than constructing a client in every request.

Prisma 7 requires a driver adapter for a direct PostgreSQL connection. The adapter is created with the connection string in application code, while Prisma CLI gets its migration URL from the Prisma config. See the official [Prisma 7 database drivers guide](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers) and [PostgreSQL connector guide](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql).

---

# Part III — Backend implementation so far

## 10. Express application setup

### `src/server.ts`

The server entry point imports the configured Express app and starts listening:

```ts
import { app } from './app.js';

const port = 3000;

app.listen(port, () => {
  console.log(`Backend running on ${port}`);
});
```

The project uses Node ESM and TypeScript `NodeNext`, so relative imports use `.js` extensions even when the source file is `.ts`. TypeScript resolves these source imports and emits JavaScript imports suitable for Node.

### `src/app.ts`

The app setup currently:

- Creates the Express app.
- Disables the `X-Powered-By` header.
- Parses JSON request bodies with a 10 KB limit.
- Provides `/` and `/health` endpoints.
- Mounts the auth router at `/api/auth`.

Representative version:

```ts
import express, { type Request, type Response } from 'express';
import { authRouter } from './routes/auth.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World');
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
  });
});

app.use('/api/auth', authRouter);
```

A previous version imported `json` and `Express` but did not use them. Those unused imports were removed. The health-check handler's unused `req` parameter was renamed `_req` to satisfy the TypeScript unused-parameter check.

The `express.urlencoded()` middleware was considered but not retained in the latest shared `app.ts`, because the React frontend is expected to send JSON. Add it only if the app needs URL-encoded HTML form submissions.

## 11. Registration validation with Zod

The registration schema was created in `src/routes/auth.ts`:

```ts
const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(254).pipe(z.email()),
  password: z.string().min(8).max(100),
});
```

Important choices:

- `username` and `name` are trimmed before length validation, so whitespace-only input does not pass as meaningful text.
- Email is trimmed, length-limited, then validated with Zod 4's `z.email()` using `.pipe()`.
- Password is deliberately **not trimmed**. Spaces can be valid password characters.
- `password` is the incoming request field. The database field is `passwordHash`; the backend hashes the incoming password before storage.

### Why `safeParse()` is used

`safeParse()` validates untrusted runtime data and returns a discriminated union:

- Success: `{ success: true, data: ... }`
- Failure: `{ success: false, error: ZodError }`

Check `result.success` before accessing `result.data` or `result.error`. TypeScript narrows the result automatically. Do not annotate incoming `req.body` as `RegisterInput` and assume it is valid: compile-time TypeScript types do not validate HTTP data at runtime.

A type can be inferred from the schema when needed:

```ts
type RegisterInput = z.infer<typeof registerSchema>;
```

Use PascalCase for the type name. The schema is a runtime value (`registerSchema`); `RegisterInput` is a compile-time type. The inferred type is useful for passing already-validated data into a service function.

## 12. Password hashing with Argon2id

`argon2` was installed as a backend dependency. The utility lives at `src/utils/password.ts`:

```ts
import * as argon2 from 'argon2';

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password);
};

export const verifyPassword = async (
  password: string,
  storedHash: string,
): Promise<boolean> => {
  return argon2.verify(storedHash, password);
};
```

Concepts learned:

- Argon2id is OWASP's recommended Argon2 variant for password storage.
- `argon2.hash(password)` asynchronously returns an encoded hash string.
- `argon2.verify(storedHash, password)` asynchronously returns a boolean.
- Argon2 creates a random salt automatically and includes it in the encoded hash. Do not manually create/store a separate salt for this normal usage.
- Hashes are not decrypted to recover passwords.
- `verify()` takes the stored hash first, then the candidate password. The wrapper accepts the password first and rearranges the arguments for the library.
- Do not log or return plaintext passwords or password hashes.
- Malformed stored hashes can make verification throw. Handle that at an appropriate application boundary if needed.

OWASP lists several equivalent minimum cost configurations for Argon2id. The project started with the package's defaults rather than custom parameters; benchmark on the target hardware before changing cost settings. See [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and the [node-argon2 package documentation](https://www.npmjs.com/package/argon2).

## 13. Registration endpoint

The endpoint is mounted at:

```text
POST http://localhost:3000/api/auth/register
```

The route flow is:

1. Validate `req.body` with `registerSchema.safeParse()`.
2. Return `400 Bad Request` if validation fails.
3. Extract validated `name`, `username`, `email`, and `password` from `result.data`.
4. Hash the password with `hashPassword()`.
5. Create the user with `prisma.user.create()`.
6. Use Prisma `select` to return public fields only.
7. Return `201 Created`.

The most recently shared code also handled Prisma's `P2002` error for duplicate unique fields:

```ts
try {
  const user = await prisma.user.create({
    select: {
      username: true,
      name: true,
      email: true,
    },
    data: {
      username,
      name,
      email,
      passwordHash,
    },
  });

  return res.status(201).json(user);
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') {
      return res.status(409).json({
        error: e.message,
      });
    }
  }
  throw e;
}
```

This is a record of the version shared during the conversation, not necessarily the final code currently saved on disk. Two improvements were recommended after review:

- Do not send Prisma's internal `e.message` to clients. Return a stable application message such as `Username or email already exists.`
- Include `id: true` in `select` if the frontend needs the new user's identifier.

The nested error conditions can also be combined. Unexpected errors are rethrown so Express 5's async error handling can forward them to error middleware.

### Why handle `P2002` rather than relying only on a pre-check?

PostgreSQL's unique constraint is the final authority. A `findUnique()` pre-check can improve the user experience, but two concurrent requests can both pass the check and then race to create the same value. Keep the database unique constraints and handle Prisma's `P2002` error.

## 14. Registration testing performed

The backend was run from `backend/` with:

```bash
npm run dev
```

Requests were sent using `curl` from a second Git Bash terminal.

### Valid registration

Expected and observed: `201 Created` with the created user's public fields. The hash and plaintext password were not included in the JSON response.

Example request:

```bash
curl -i -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Developer",
    "username": "testdeveloper",
    "email": "testdeveloper@example.com",
    "password": "StrongPassword123"
  }'
```

### Duplicate username

Observed: `409 Conflict`.

### Invalid email

Observed: `400 Bad Request`, with a Zod issue identifying the `email` field and `Invalid email address` message.

### Password shorter than eight characters

Observed: `400 Bad Request`, with a Zod `too_small` issue for `password`.

### PostgreSQL verification

The user record was inspected in pgAdmin. Its `passwordHash` began with `$argon2id$`, confirming an Argon2id encoded hash rather than the original password.

A SQL query to inspect public fields without displaying the full hash:

```sql
SELECT id, name, username, email, "createdAt"
FROM "User"
ORDER BY id DESC;
```

To inspect only the hash prefix if needed:

```sql
SELECT username, LEFT("passwordHash", 10) AS hash_prefix
FROM "User";
```

Do not copy or share the full hash.

---

# Part IV — Configuration and development workflow

## 15. Backend `package.json`

The backend package name is `devbook-api`, and it uses ESM via:

```json
"type": "module"
```

The main scripts used:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc"
  }
}
```

`tsx watch` runs TypeScript directly for development and restarts on changes. `tsc` performs TypeScript compilation into `dist/`.

A default npm `test` placeholder was present originally. It does not run real tests; replace it when a real test runner is introduced. The original `main: "index.js"` was also a default placeholder and is not used by the current `dev` or `build` scripts. Do not treat it as the server entry point.

Installed backend packages include Express, Prisma Client, Prisma PostgreSQL adapter, `pg`, dotenv, Zod, and Argon2, together with TypeScript/tsx/Prisma CLI and type packages. Prettier was subsequently installed as a backend development dependency. ESLint setup was discussed but then deferred; do not assume an ESLint config is complete.

## 16. TypeScript configuration

The backend uses Node ESM and TypeScript's `NodeNext` module behavior. Important options include:

- `rootDir: "./src"`
- `outDir: "./dist"`
- `module: "NodeNext"`
- `moduleResolution: "NodeNext"`
- `target: "ES2023"`
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `verbatimModuleSyntax: true`
- `isolatedModules: true`
- `skipLibCheck: true`
- `types: ["node"]`
- `include: ["src"]`

The shared `tsconfig.json` also contained options such as `jsx`, `declaration`, `declarationMap`, `moduleDetection`, and `noUncheckedSideEffectImports`. They were reviewed but not necessarily removed; the decision was not to over-optimize config before the project needs it.

With NodeNext and `"type": "module"`, relative source imports generally use `.js` specifiers, for example:

```ts
import { app } from './app.js';
```

The generated client is inside `src`, so it is included in the backend TypeScript build. `dist/` is generated build output, not source code. It can be deleted, but the next `npm run build` will recreate it.

## 17. `.gitignore`

The root `.gitignore` was reviewed and the important rules are:

```gitignore
# Dependencies
node_modules/

# Environment variables and secrets
.env
.env.*
!.env.example

# Generated Prisma Client
/backend/src/generated/prisma/

# Build output
dist/
build/

# Logs
npm-debug.log*
*.log

# OS and editor files
.DS_Store
Thumbs.db
.vscode/
```

Because `dist/` matches directories with that name throughout the repository, explicit `/backend/dist/` and `/frontend/dist/` patterns are redundant. The root rule `/backend/src/generated/prisma/` matches the current generated client location.

A Git ignore rule does not untrack a file already committed. `git check-ignore` is a useful check. From the repository root:

```bash
git check-ignore -v backend/.env
git check-ignore -v backend/src/generated/prisma/client.ts
```

From inside `backend/`, use a path relative to that directory:

```bash
git check-ignore -v .env
git check-ignore -v src/generated/prisma/client.ts
```

An earlier check used `backend/src/...` while already inside `backend/`, so it looked for the wrong path. The ignore rule itself was correct.

## 18. Prettier and ESLint

- The VS Code Prettier extension was installed and was formatting files even before the npm package was installed. The extension can bundle a formatter, but a local Prettier dependency makes the project/tooling version reproducible.
- `.prettierrc.json` is in the repository root with:

  ```json
  {
    "singleQuote": true
  }
  ```

  Prettier searches parent directories for configuration, so this root configuration can be shared by frontend and backend.
- Prettier was installed in `backend` with `npm install -D prettier`.
- The VS Code ESLint extension was also present. Its role is editor integration; it is not a substitute for installing/configuring ESLint in the project. Full ESLint setup was deferred.
- The user chose to stop spending time on formatting/lint tooling and move on to features. Keep it that way unless a real need arises.

---

# Part V — Issues encountered and how they were resolved

This section is intended as a troubleshooting reference for the next project.

## 19. `psql` and `createdb` not found

**Symptom:**

```text
bash: psql: command not found
bash: createdb: command not found
```

**Cause:** PostgreSQL CLI binaries were not available on Git Bash's PATH. This did not prove PostgreSQL itself was absent.

**Solution used:** create the database through pgAdmin's **Databases → Create → Database** menu. Optionally add PostgreSQL's `bin` directory to PATH later if the CLI is needed.

## 20. No password field in database Properties

**Symptom:** The database properties dialog did not show a password field.

**Cause:** The password belongs to a PostgreSQL login role, not to an individual database.

**Solution:** use **Login/Group Roles → postgres → Properties → Definition**. Alternatively, execute `ALTER ROLE postgres WITH PASSWORD ...` with sufficient permissions.

## 21. PostgreSQL password authentication failed in pgAdmin

**Symptom:** pgAdmin reported `FATAL: Passwort-Authentifizierung für Benutzer postgres fehlgeschlagen`.

**Relevant concepts:**

- The password in a connection URL can be percent-encoded.
- pgAdmin's password field expects the raw password.
- `%40` in the URL represents an actual `@` in the password.
- The literal `@` after the encoded password separates credentials from the host.

Prisma had previously connected successfully using `.env`, while pgAdmin temporarily failed. A clipboard command using `clip.exe` produced `stdout is not a tty`. Closing and reopening pgAdmin was followed by a successful connection. The exact root cause was not proven. Avoid repeatedly changing passwords when one client already connects; first check that both tools target the same server, port, role, and database.

## 22. `npx prisma` prompted to install Prisma 8 RC

**Symptom:** Running a Prisma command from the repository root prompted to install a different Prisma 8 release candidate.

**Cause:** Prisma was installed as a dependency in `backend`, not at the monorepo root. Running `npx` from the wrong working directory can cause it to search a different package context and offer a download.

**Solution:** cancel the prompt, enter the backend folder, and confirm the local version:

```bash
cd backend
npx prisma --version
```

Run backend Prisma commands from `backend/` so the project's locally installed Prisma 7.10.1 CLI is used. Avoid accepting an unexpected major-version install prompt.

## 23. Prisma 7 migration and generated client are separate steps

**Learning point:** `migrate dev` updates the database and records a migration. `generate` updates the generated TypeScript client. In this setup both were run explicitly:

```bash
npx prisma migrate dev --name update_user_and_post_models
npx prisma generate
npx prisma migrate status
```

## 24. Migration warned about dropping `isActive` and adding `name`

**Cause:** the schema was changed to remove `isActive` and add a required `name` column.

**Solution in this project:** the development database was empty, so losing the old column and adding a non-null column was safe. In a real populated database, use a staged migration/backfill.

## 25. TypeScript build complained about unused values

Errors included:

```text
' req ' is declared but its value is never read.
' prisma ' is declared but its value is never read.
```

**Cause:** `noUnusedParameters` / `noUnusedLocals` checks were enabled, or the equivalent diagnostics were active.

**Solutions:**

- Rename an intentionally unused route parameter to `_req`.
- Remove an import until it is actually used.
- Do not keep unused imports just because a future feature may need them.

## 26. TypeScript said `result.error` may be undefined

**Cause:** the code attempted to access `result.error` outside the branch where Zod's discriminated union proves parsing failed.

**Solution:** return immediately from the invalid branch:

```ts
const result = registerSchema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json({ errors: result.error.issues });
}

// Here TypeScript knows result.data is available.
```

This is TypeScript discriminated-union narrowing.

## 27. Created Prisma `user` variable was unused

**Cause:** the route awaited `prisma.user.create()` but did not use its result.

**Solution:** return the created record, using Prisma `select` to choose only safe public fields. Never return the password or `passwordHash`.

## 28. Confusion between `password` and `passwordHash`

**Clarification:**

- Incoming HTTP body and Zod schema use `password`.
- Argon2 converts that password into an encoded hash.
- Prisma writes the result to the `passwordHash` database field.

The frontend must never submit a `passwordHash`; hashing happens only on the backend.

## 29. `z.email()` and trimming

**Clarification:** validation and transformation are different. A format validator checks the value; it does not necessarily trim it.

The working Zod 4 schema uses:

```ts
email: z.string().trim().max(254).pipe(z.email()),
```

This trims the string, enforces the maximum length, and then pipes the resulting value through email validation.

## 30. `RegisterInput` and Express `req.body`

**Incorrect assumption:** typing the request parameter as `{ body: RegisterInput }` makes client data valid.

TypeScript types disappear at runtime and do not validate JSON from a browser or curl. Keep `req.body` as untrusted input, validate it with Zod, and use `result.data` after successful parsing. Use `z.infer<typeof registerSchema>` for internal functions that receive already-validated registration data.

## 31. Prettier extension vs package

The VS Code Prettier extension was able to format files using its bundled copy even when `npm ls prettier` showed no local package. A local install is still useful for reproducible project tooling. The extension and npm package are separate pieces.

The ESLint extension is editor integration and normally needs an actual ESLint package/configuration to lint the project. Full lint configuration was deferred.

## 32. `.gitignore` check used the wrong relative path

A check for `backend/src/generated/prisma/client.ts` was run while the current directory was already `backend/`. Use `src/generated/prisma/client.ts` from that directory, or use the longer path from the repository root.

---

# Part VI — Current status and next work

## 33. Completed or verified

- [x] Renamed local project folder to `devbook`.
- [x] Created PostgreSQL database `devbook` through pgAdmin.
- [x] Updated the backend connection URL and changed the PostgreSQL role password.
- [x] Confirmed Prisma can connect to `devbook`.
- [x] Defined `User`, `Post`, and `Role` models.
- [x] Created and applied two Prisma migrations.
- [x] Confirmed migration status is up to date.
- [x] Generated Prisma Client at `backend/src/generated/prisma`.
- [x] Configured Express and mounted the auth router.
- [x] Added Zod registration validation.
- [x] Added Argon2id password hashing and verification utilities.
- [x] Implemented registration with Prisma.
- [x] Tested successful registration (`201`).
- [x] Tested duplicate username (`409`).
- [x] Tested invalid email (`400`).
- [x] Tested short password (`400`).
- [x] Inspected the PostgreSQL record and verified an Argon2id hash was stored.
- [x] Configured root `.gitignore` and root Prettier settings.

## 34. Remaining improvements / next features

These are not all implemented yet:

1. **Review registration error response:** replace Prisma's internal `e.message` in the `P2002` response with a stable public message. Consider inspecting `e.meta?.target` if the API should distinguish username from email.
2. **Registration response:** include `id: true` in Prisma `select` if the client needs the new user's ID. Current most recently shared query selected username, name, and email.
3. **Centralized error middleware:** log unexpected errors on the server and return consistent generic JSON responses. Do not reveal stack traces or raw internal errors to clients.
4. **Login endpoint:** validate credentials, retrieve the user, check account/role rules as applicable, and use `verifyPassword(password, user.passwordHash)`.
5. **Authentication mechanism:** decide how to issue and validate sessions or tokens. Do not invent this as part of registration; design it when implementing login.
6. **Post creation and feed:** implement CRUD for developer milestones and ideas, using the existing `Post` model.
7. **Profiles and connections:** design these when the product flow requires them.
8. **Frontend integration:** connect React to the API and handle validation/conflict responses.
9. **Testing:** add focused tests when core routes and services stabilize.
10. **Deployment and CI/CD:** configure environment variables, migrations, build/start scripts, and deployment once the app has a useful working MVP.

The next planned work when this document was written was centralized Express error-handling middleware.

---

# Part VII — Reusable step-by-step: initialize a full-stack project on Windows

This recipe reproduces the architecture used in Devbook: one repository with a Vite React TypeScript frontend and an Express TypeScript backend, PostgreSQL, and Prisma 7. It assumes Windows, PowerShell or Git Bash, Node.js, npm, Git, and PostgreSQL installed. You can use pgAdmin instead of the PostgreSQL CLI if `psql` / `createdb` are not on PATH.

> **Version choice:** this recipe intentionally shows the Prisma 7 pattern because that is what Devbook uses. Before starting a brand-new project, check Prisma's current major version. If you choose Prisma 8 or a later major, follow that major's installation/configuration guide consistently. Do not blindly copy Prisma 7 setup into a different major.

## Step 1 — Check the tools

Open PowerShell or Git Bash and check:

```bash
node --version
npm --version
git --version
```

Check that PostgreSQL is installed/running. On Windows PowerShell, a quick service check is:

```powershell
Get-Service *postgres*
```

If you use pgAdmin, open it and confirm you can connect to your local PostgreSQL server.

## Step 2 — Create the repository root

Choose a workspace directory and create the project:

```bash
cd ~/Programming
mkdir devbook
cd devbook
git init -b main
```

Create the README and root `.gitignore` early. Keep secrets out of Git from the beginning.

Example root layout:

```text
devbook/
├── frontend/
├── backend/
├── .gitignore
└── README.md
```

## Step 3 — Create the React + TypeScript frontend

From the repository root:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm run dev
```

Vite prints a local development URL (commonly `http://localhost:5173`). Open it and verify the starter app loads. Then return to the repository root:

```bash
cd ..
```

The `react-ts` template creates a React application configured for TypeScript. Vite's official guide lists `react-ts` as the React + TypeScript template: https://vite.dev/guide/.

## Step 4 — Create the backend package

From the repository root:

```bash
mkdir backend
cd backend
npm init -y
```

Set ESM and the package name. You can edit `package.json` manually or use npm:

```bash
npm pkg set name=devbook-api
npm pkg set type=module
```

Install runtime dependencies for this stack:

```bash
npm install express@5 dotenv zod argon2
```

Install development and type dependencies:

```bash
npm install -D typescript tsx @types/express @types/node @types/pg
```

For Express with TypeScript, Express's installation guide recommends TypeScript and the community type packages. See https://expressjs.com/en/starter/installing/.

## Step 5 — Add backend scripts

Edit `backend/package.json` and set scripts similar to:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc"
  }
}
```

You can add a production `start` script once you have confirmed the compiled output path and Node ESM imports. Don't leave a fake `test` script pretending to run tests; add a real test runner when you are ready to write tests.

## Step 6 — Create TypeScript configuration

Create `backend/tsconfig.json`. A practical starting point for a compiled Node ESM backend is:

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "NodeNext",
    "target": "ES2023",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "types": ["node"],
    "sourceMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noEmitOnError": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

This is a starting point, not a mandatory universal config. Keep the configuration understandable. The backend does not need React's `jsx` option. NodeNext reflects Node's ESM rules; with `"type": "module"`, use `.js` extensions in relative imports inside TypeScript source files. TypeScript docs: https://www.typescriptlang.org/docs/handbook/modules/reference.html.

## Step 7 — Create the basic Express application

Create these files:

```text
backend/src/
├── app.ts
└── server.ts
```

`src/app.ts` should configure the app and middleware, without starting the listening socket:

```ts
import express from 'express';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
```

`src/server.ts` starts the server:

```ts
import { app } from './app.js';

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
```

For a production app, load environment variables deliberately and validate required settings at startup. For the first local version, you can start with a fixed port and move it to `.env` when useful.

Run:

```bash
npm run dev
```

Check `/health` in a browser or with curl before adding a database.

## Step 8 — Add Prisma 7 and the PostgreSQL adapter

First, choose the Prisma major version and consult its matching guide. To reproduce Devbook's Prisma 7 setup with the versions used in this project:

```bash
npm install @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 pg
npm install -D prisma@7.10.1
```

`@prisma/client`, `prisma`, and `@prisma/adapter-pg` should be on compatible, matching Prisma 7 versions. The PostgreSQL `pg` driver is also required for this adapter.

Initialize Prisma if using the CLI's Prisma 7 initializer, or create the files manually as below. If you use `prisma init`, review the generated files rather than assuming the output exactly matches this project's custom client path.

Create:

```text
backend/
├── prisma/
│   └── schema.prisma
└── prisma.config.ts
```

Example `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique @db.VarChar(30)
  email        String   @unique @db.VarChar(254)
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Example `prisma.config.ts` (in `backend/`):

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

Prisma 7's datasource URL belongs in the Prisma config for CLI operations. The schema's datasource block specifies the provider.

## Step 9 — Create the PostgreSQL database and `.env`

In pgAdmin:

1. Connect to your local PostgreSQL server.
2. Right-click **Databases → Create → Database**.
3. Give it the project name (for example `devbook`).
4. Select the appropriate owner and save.

Create `backend/.env`:

```dotenv
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/devbook?schema=public"
```

Use the actual local credentials and database name. URL-encode reserved characters in the password portion. Never commit `.env`.

Create `backend/.env.example` with a placeholder, not a real secret:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public"
```

## Step 10 — Generate and migrate

From `backend/`:

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
npx prisma migrate status
```

The migration name is a human-readable description, such as `init`, `add_user_profile`, or `update_user_and_post_models`. `change_name` is only a placeholder.

Before accepting a reset prompt, check which database URL is active and whether the database contains data you need. Do not reset a valuable database just to get a migration to work.

Commit the `prisma/schema.prisma` and `prisma/migrations/` files. Migration history belongs in Git. Generated Prisma Client output can remain ignored if your build/deployment runs `prisma generate`.

## Step 11 — Create one shared Prisma Client instance

Create `backend/src/db/prisma.ts`:

```ts
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
```

This is the Prisma 7 + PostgreSQL `pg` adapter pattern. Import this shared `prisma` object wherever database access is needed. Do not instantiate a new Prisma Client per route or request.

Official Prisma 7 references:

- https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql
- https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers

## Step 12 — Organize routes and middleware as features appear

Start small:

```text
backend/src/
├── db/
│   └── prisma.ts
├── routes/
│   └── auth.ts
├── app.ts
└── server.ts
```

Mount a router in the app:

```ts
import { authRouter } from './routes/auth.js';
app.use('/api/auth', authRouter);
```

A route declared as `authRouter.post('/register', ...)` is therefore available at `/api/auth/register`.

Add `services/`, `middleware/`, or other folders when there is a real responsibility to separate. Do not create empty architecture folders just to make the tree look sophisticated.

## Step 13 — Add runtime validation and password hashing

Install:

```bash
npm install zod argon2
```

Create a Zod schema for external input. Example:

```ts
import * as z from 'zod';

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(254).pipe(z.email()),
  password: z.string().min(8).max(100),
});
```

Use `safeParse(req.body)` before trusting the body. TypeScript annotations alone do not validate HTTP input.

Hash passwords using Argon2id through the `argon2` package. Never save plaintext passwords, never send hashes to the client, and verify login passwords using `argon2.verify(storedHash, submittedPassword)`.

## Step 14 — Add a root `.gitignore`

A useful monorepo starting point:

```gitignore
# Dependencies
node_modules/

# Environment variables and secrets
.env
.env.*
!.env.example

# Generated Prisma Client
/backend/src/generated/prisma/

# Build output
dist/
build/

# Logs
npm-debug.log*
*.log

# OS and editor files
.DS_Store
Thumbs.db
.vscode/
```

Adjust generated paths if you choose a different Prisma generator output. Check rules with `git check-ignore -v <path>`.

## Step 15 — Add shared formatting and documentation

At the repository root, you can add `.prettierrc.json`:

```json
{
  "singleQuote": true
}
```

Install Prettier in the package where you want to run it, or at the root if you intentionally create a root npm workspace. The VS Code extension alone can format files, but a local dependency makes the version reproducible.

Keep a concise README that says what the product is and what currently works. Do not advertise planned features as already implemented.

## Step 16 — Verify and commit in sensible milestones

From the relevant package directories:

```bash
# backend
npm run build
npm run dev
```

From the repository root:

```bash
git status --short
```

Stage related files by purpose. Examples:

```bash
git add .gitignore README.md
# review, then commit

git add backend/package.json backend/package-lock.json backend/tsconfig.json
# review, then commit

git add backend/prisma/schema.prisma backend/prisma/migrations/
# review, then commit

git add backend/src/
# review, then commit
```

Before each commit:

```bash
git diff --cached
```

Make sure `.env`, real credentials, generated build files, and accidental local files are not staged. Then commit with a clear message. Push useful milestones to the private GitHub repository rather than waiting for the entire product to be completed.

## Step 17 — Keep frontend and backend responsibilities clear

- React handles the UI, forms, client-side interactions, and API calls.
- Express handles HTTP endpoints, runtime validation, authentication, authorization, and application logic.
- Prisma Client handles type-safe database queries.
- PostgreSQL stores the persistent data.
- Prisma Migrate tracks and applies database structure changes.

The frontend should call the backend API rather than connect directly to PostgreSQL. Never expose database credentials or password hashing logic to the browser.

## Step 18 — Deployment comes after a working MVP

Before deployment, establish:

- A production `build` and `start` command for the backend.
- A frontend production build.
- Production environment variables configured in the hosting provider (not committed in `.env`).
- A managed or hosted PostgreSQL database.
- A deliberate production migration command such as `prisma migrate deploy` for the Prisma 7 workflow.
- A safe Prisma Client generation step during deployment/build.
- CORS rules that allow only the intended frontend origins.
- Logging and error handling that do not leak secrets or internal stack traces to clients.

Do not deploy an unfinished architecture just to add infrastructure. Get the core user journey working locally first.

---

# Part VIII — Official references

The following official documentation links were checked while preparing this guide. Always use the documentation matching the major version installed in the project.

- [Vite — Getting Started](https://vite.dev/guide/)
- [Express — Installing](https://expressjs.com/en/starter/installing/)
- [Express 5 — Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Express — Routing](https://expressjs.com/en/guide/routing.html)
- [TypeScript — Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [Prisma ORM 7 — Overview](https://www.prisma.io/docs/orm/v7)
- [Prisma ORM 7 — PostgreSQL](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql)
- [Prisma ORM 7 — Database Drivers](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers)
- [Prisma ORM 7 — Migrate](https://www.prisma.io/docs/orm/v7/prisma-migrate)
- [Prisma Client — CRUD](https://www.prisma.io/docs/orm/prisma-client/queries/crud)
- [Zod — Basics](https://zod.dev/basics)
- [Zod — API](https://zod.dev/api)
- [node-argon2 — npm package](https://www.npmjs.com/package/argon2)
- [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Prettier — Options](https://prettier.io/docs/options)
- [Git — gitignore](https://git-scm.com/docs/gitignore)

---

_End of Devbook project notes._
