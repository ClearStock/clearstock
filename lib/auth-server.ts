/**
 * Server-side authentication utilities
 * Centralized authentication logic - all server code should use these functions
 * 
 * PRINCIPLES:
 * - Cookies are only created/managed on the server
 * - Session tokens are opaque (random strings)
 * - restaurantId is never exposed in cookies directly
 * - All authentication checks go through this module
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "clearstock_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a secure random session token
 */
function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a new session for a restaurant
 * Returns the session token (to be stored in cookie)
 */
export async function createSession(restaurantId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      token,
      restaurantId,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  return token;
}

/**
 * Get the current session token from cookie
 */
async function getSessionTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value || null;
}

/**
 * Validate session and return restaurant ID
 * This is the MAIN authentication function - use this everywhere
 * 
 * Returns:
 * - { restaurantId: string } if session is valid
 * - null if session is invalid/expired/missing
 */
export async function getAuthenticatedRestaurantId(): Promise<string | null> {
  const token = await getSessionTokenFromCookie();
  
  if (!token) {
    return null;
  }

  // Find session and check if it's valid
  const session = await db.session.findUnique({
    where: { token },
    include: {
      restaurant: {
        select: { id: true },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await db.session.delete({ where: { id: session.id } }).catch(() => {
      // Ignore errors during cleanup
    });
    return null;
  }

  // Update lastUsedAt to track activity
  await db.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {
    // Ignore errors - non-critical update
  });

  return session.restaurantId;
}

/**
 * Set session cookie (server-side only)
 * Should be called after successful login
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // Prevent JavaScript access
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Clear session cookie and delete session from database
 * Should be called on logout
 */
export async function clearSession(): Promise<void> {
  const token = await getSessionTokenFromCookie();
  
  if (token) {
    // Delete session from database
    await db.session.deleteMany({
      where: { token },
    }).catch(() => {
      // Ignore errors
    });
  }

  // Clear cookie
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Clean up expired sessions (can be called periodically)
 * Returns number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

