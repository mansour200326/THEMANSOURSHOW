import "server-only";

/**
 * Who's allowed to change other people's plans.
 *
 * A list of email addresses in an environment variable, checked against the
 * signed-in session. Not a role column, because a role column invites a UI to
 * manage roles, and there is exactly one administrator.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
