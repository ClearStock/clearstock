"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getRestaurantId, setAuth, isAuthenticated } from "@/lib/auth";

/**
 * Client component to sync localStorage auth state to cookies
 * This allows server components to read restaurantId from cookies
 */
export function SyncAuthCookie() {
  const pathname = usePathname();
  const publicRoutes = ["/", "/acesso"];

  useEffect(() => {
    // Only sync on authenticated routes
    if (publicRoutes.includes(pathname)) {
      // Clear cookie on public routes
      document.cookie = "clearskok_restaurantId=; path=/; max-age=0";
      return;
    }

    // Sync localStorage to cookie
    if (isAuthenticated()) {
      const restaurantId = getRestaurantId();
      if (restaurantId) {
        // Set cookie (expires in 7 days)
        const expires = new Date();
        expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
        document.cookie = `clearskok_restaurantId=${restaurantId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      }
    } else {
      // Clear cookie if not authenticated
      document.cookie = "clearskok_restaurantId=; path=/; max-age=0";
    }
  }, [pathname]);

  return null;
}

