/* POST /api/logout — clears the session cookie. */

import { json } from "../_utils.js";

export async function onRequestPost() {
  return json({ ok: true }, 200, {
    "Set-Cookie": "hand_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  });
}
