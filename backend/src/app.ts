import express, {
  json,
  type Express,
  type Request,
  type Response,
} from "express";

export const app = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});
