"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "@/components/main-nav";

interface ConditionalNavClientProps {
  restaurantName: string | null;
}

/**
 * Client component that conditionally renders MainNav based on route
 * Hides navbar on landing page (/) and access page (/acesso)
 */
export function ConditionalNavClient({ restaurantName }: ConditionalNavClientProps) {
  const pathname = usePathname();

  // Public routes where navbar should NOT be shown
  const publicRoutes = ["/", "/acesso", "/onboarding"];

  // Don't show navbar on public routes
  if (publicRoutes.includes(pathname)) {
    return null;
  }

  // Show navbar on all other routes (protected routes)
  // The server-side AuthGuard will redirect if not authenticated
  return <MainNav restaurantName={restaurantName} />;
}

