import { MainNav } from "@/components/main-nav";
import { getAuthenticatedRestaurantId } from "@/lib/auth-server";
import { getRestaurantByTenantId } from "@/lib/data-access";
import { ConditionalNavClient } from "@/components/conditional-nav-client";

/**
 * Server component that conditionally renders MainNav only on authenticated pages
 * Hides navbar on landing page (/) and access page (/acesso)
 * Uses centralized authentication helper
 */
export async function ConditionalNav() {
  // Check authentication using centralized helper
  const restaurantId = await getAuthenticatedRestaurantId();

  // If not authenticated, don't show nav (client component will handle route checking)
  if (!restaurantId) {
    return <ConditionalNavClient restaurantName={null} />;
  }

  // Fetch restaurant to get name
  try {
    const restaurant = await getRestaurantByTenantId(restaurantId);
    return <ConditionalNavClient restaurantName={restaurant.name} />;
  } catch (error) {
    console.error("Error fetching restaurant for nav:", error);
    return <ConditionalNavClient restaurantName={null} />;
  }
}
