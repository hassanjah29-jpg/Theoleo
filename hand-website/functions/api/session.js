/* GET /api/session — who is signed in, if anyone. */

import { json, verifySession } from "../_utils.js";

export async function onRequestGet({ request, env }) {
  const user = await verifySession(env, request);
  return user ? json({ user }) : json({ error: "Not signed in" }, 401);
}
