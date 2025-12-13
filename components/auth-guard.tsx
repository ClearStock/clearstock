"use client";

/**
 * Client-side route guard component
 * Note: Server-side authentication is already enforced in Server Components
 * This component is kept for backward compatibility but does minimal work
 * The real protection happens server-side via requireAuth()
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  // Server-side authentication is already enforced
  // This component just renders children
  return <>{children}</>;
}
