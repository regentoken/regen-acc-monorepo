import { createHash, timingSafeEqual } from "node:crypto";
import type { AstroCookies } from "astro";

// Smallest viable admin auth (RGA-015): no user/session table. The cookie
// holds a fixed token derived from ADMIN_SECRET, checked on every admin
// request. Rotating ADMIN_SECRET invalidates every existing session, which
// is the intended (and only) revocation mechanism at this scale.
const COOKIE_NAME = "admin_session";

function expectedToken(): string {
  return createHash("sha256").update(`admin:${process.env.ADMIN_SECRET}`).digest("hex");
}

export function isAdminAuthed(cookies: AstroCookies): boolean {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = expectedToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function setAdminSession(cookies: AstroCookies): void {
  cookies.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    // Must be site-wide, not scoped to /admin: the admin actions this
    // cookie authorizes live at /_actions/admin.*, a different path, and a
    // browser (or curl) never sends a path-scoped cookie outside its scope.
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export function clearAdminSession(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, { path: "/" });
}
