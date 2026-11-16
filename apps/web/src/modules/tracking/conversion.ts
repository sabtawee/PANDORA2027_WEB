import "server-only";

/** A user created this recently just finished signing up (fires the conversion pixel). */
const NEW_USER_WINDOW_MS = 15 * 60 * 1000;

export function isFreshSignup(createdAt: Date) {
  return Date.now() - createdAt.getTime() < NEW_USER_WINDOW_MS;
}
