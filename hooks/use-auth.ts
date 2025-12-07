"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  getRestaurantId,
  hasValidSession,
  setAuth,
  clearAuth,
  type RestaurantId,
} from "@/lib/auth";

/**
 * Hook to manage authentication state
 * Provides current auth status and restaurant ID
 * Now checks for valid session first
 */
export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [restaurantId, setRestaurantId] = useState<RestaurantId | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth status on mount and whenever storage changes
    const checkAuth = () => {
      // First check for valid session (7-day persistence)
      const hasSession = hasValidSession();
      // Fallback to old auth check for backward compatibility
      const isAuth = hasSession || isAuthenticated();
      const restId = getRestaurantId();
      
      setAuthenticated(isAuth);
      setRestaurantId(restId);
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (e.g., in other tabs)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check on focus in case auth changed in another tab
    window.addEventListener("focus", checkAuth);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  return {
    authenticated,
    restaurantId,
    loading,
    setAuth,
    clearAuth,
  };
}

/**
 * Hook to protect routes - redirects to /acesso if not authenticated
 */
export function useAuthGuard() {
  const router = useRouter();
  const { authenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/acesso");
    }
  }, [authenticated, loading, router]);

  return { authenticated, loading };
}

