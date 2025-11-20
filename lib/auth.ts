/**
 * Authentication utilities for PIN-based access
 * Restaurant tenant system using localStorage
 */

export type RestaurantId = "A" | "B" | "C";

const STORAGE_KEYS = {
  authenticated: "clearskok_authenticated",
  restaurantId: "clearskok_restaurantId",
} as const;

/**
 * PIN to RestaurantId mapping
 */
export const PIN_TO_RESTAURANT: Record<string, RestaurantId> = {
  "1111": "A",
  "2222": "B",
  "3333": "C",
};

/**
 * RestaurantId to display name mapping
 */
export const RESTAURANT_NAMES: Record<RestaurantId, string> = {
  A: "Restaurante A",
  B: "Restaurante B",
  C: "Restaurante C",
};

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  
  const authenticated = localStorage.getItem(STORAGE_KEYS.authenticated);
  const restaurantId = localStorage.getItem(STORAGE_KEYS.restaurantId);
  
  return authenticated === "true" && 
         !!restaurantId && 
         ["A", "B", "C"].includes(restaurantId);
}

/**
 * Get current restaurant ID from localStorage
 */
export function getRestaurantId(): RestaurantId | null {
  if (typeof window === "undefined") return null;
  
  const restaurantId = localStorage.getItem(STORAGE_KEYS.restaurantId);
  
  if (restaurantId && ["A", "B", "C"].includes(restaurantId)) {
    return restaurantId as RestaurantId;
  }
  
  return null;
}

/**
 * Set authentication and restaurant ID
 */
export function setAuth(restaurantId: RestaurantId): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(STORAGE_KEYS.authenticated, "true");
  localStorage.setItem(STORAGE_KEYS.restaurantId, restaurantId);
}

/**
 * Clear authentication
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(STORAGE_KEYS.authenticated);
  localStorage.removeItem(STORAGE_KEYS.restaurantId);
}

/**
 * Validate PIN and return restaurant ID if valid
 */
export function validatePIN(pin: string): RestaurantId | null {
  const restaurantId = PIN_TO_RESTAURANT[pin.trim()];
  return restaurantId || null;
}

