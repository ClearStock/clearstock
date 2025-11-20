"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side route guard component
 * Redirects to /acesso if user is not authenticated
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { authenticated, loading } = useAuthGuard();

  // Show nothing while checking auth status
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}

