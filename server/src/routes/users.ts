import { Router } from "express";
import { createUser } from "../db.js";
import { parseBody, requireUser } from "../http.js";
import { createUserSchema } from "../schemas.js";

export const usersRouter = Router();

/** Create a user. Returns the one-time-shown bearer token. */
usersRouter.post("/", (req, res) => {
  const { name } = parseBody(createUserSchema, req.body);
  const user = createUser(name);
  res.status(201).json(user);
});

/** Identify the calling user from their token. */
usersRouter.get("/me", requireUser, (req, res) => {
  res.json(req.user);
});
