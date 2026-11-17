import { rateLimit } from "express-rate-limit";

const rateLimitMessage = {
  error: "Too many requests, please try again later",
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  ipv6Subnet: 56,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  ipv6Subnet: 56,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  ipv6Subnet: 56,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

export const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => `user:${req.user!.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});
