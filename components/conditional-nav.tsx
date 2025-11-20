"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import { useAuth } from "@/hooks/use-auth";

/**
 * Conditionally renders MainNav only on authenticated pages
 * Hides navbar on landing page (/) and access page (/acesso)
 */
export function ConditionalNav() {
  const pathname = usePathname();
  const { authenticated, loading } = useAuth();

  // Public routes where navbar should NOT be shown
  const publicRoutes = ["/", "/acesso"];

  // Don't show navbar on public routes
  if (publicRoutes.includes(pathname)) {
    return null;
  }

  // Show navbar only if authenticated (or while loading to prevent flash)
  // The AuthGuard will redirect if not authenticated
  if (authenticated || loading) {
    return <MainNav />;
  }

  // Don't show navbar if not authenticated (will redirect)
  return null;
}

