import { getOrCreateUser } from "./auth";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Check if the current user is an admin. Throws if not.
 */
export async function requireAdmin() {
  const user = await getOrCreateUser();
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    throw new Error("Forbidden");
  }
  return user;
}
