import express, { type Request, type Response } from "express";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/error-handler.js";
import cookieParser from "cookie-parser";
import { adminRouter } from "./routes/admin.js";
import { postsRouter } from "./routes/posts.js";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

export const app = express();

const parseTrustProxy = (
  value: string | undefined,
): boolean | number | string => {
  if (value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "blob:", "https://ik.imagekit.io"],
      },
    },
  }),
);
const trustProxy = process.env.TRUST_PROXY;
app.set("trust proxy", parseTrustProxy(trustProxy));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/posts", postsRouter);

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../frontend/dist",
  );
  const indexFile = path.join(frontendDist, "index.html");

  if (!existsSync(indexFile)) {
    console.warn(
      `Frontend build not found at ${frontendDist}. Run the frontend build first.`,
    );
  }

  app.use(
    express.static(frontendDist, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  app.get(/.*/, (req, res, next) => {
    if (
      req.path === "/api" ||
      req.path.startsWith("/api/") ||
      path.extname(req.path)
    ) {
      next();
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexFile, (error) => {
      if (error) next(error);
    });
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});
app.use(errorHandler);
