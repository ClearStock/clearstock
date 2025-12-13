/**
 * Helper functions for protected pages
 * Use these in Server Components (pages) to check authentication
 */

import { redirect } from "next/navigation";
import { getAuthenticatedRestaurantId } from "@/lib/auth-server";
import { getRestaurantByTenantId } from "@/lib/data-access";

/**
 * Get authenticated restaurant or redirect to login
 * Use this at the top of protected page Server Components
 * 
 * Returns the restaurant object if authenticated
 * Redirects to /acesso if not authenticated
 */
export async function requireAuth() {
  const restaurantId = await getAuthenticatedRestaurantId();
  
  if (!restaurantId) {
    redirect("/acesso");
  }

  // Get restaurant by ID (works for both legacy RestaurantId and new restaurant IDs)
  const restaurant = await getRestaurantByTenantId(restaurantId);
  
  if (!restaurant) {
    redirect("/acesso");
  }

  return restaurant;
}

