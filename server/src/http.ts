import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { findUserByToken } from "./db.js";
import type { User } from "./types.js";

/** Thrown by handlers to produce a consistent error JSON response. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user: User;
  }
}

/**
 * Bearer-token identification. NOT real authentication — tokens are opaque
 * random ids with no passwords, expiry, or hashing. Accepts either
 * `Authorization: Bearer <token>` or `X-User-Token: <token>`.
 */
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1] ?? req.header("x-user-token");
  if (!token) {
    throw new HttpError(
      401,
      "unauthorized",
      "Missing credentials. Send 'Authorization: Bearer <token>' or 'X-User-Token: <token>'."
    );
  }
  const user = findUserByToken(token.trim());
  if (!user) {
    throw new HttpError(401, "unauthorized", "Unknown token.");
  }
  req.user = user;
  next();
}

/** Parse a request body against a zod schema, or throw a helpful 400. */
export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(
      400,
      "bad_request",
      "Request body failed validation.",
      result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }))
    );
  }
  return result.data;
}

/** Final error handler — every error becomes { error: { code, message, details? } }. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  // Express 5 / body-parser JSON syntax errors carry a status.
  const status = (err as { status?: number }).status;
  if (status === 400) {
    res.status(400).json({
      error: { code: "bad_request", message: "Malformed JSON body." },
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: { code: "internal_error", message: "Unexpected server error." },
  });
}
