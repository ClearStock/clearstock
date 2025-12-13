import { AuthGuard } from "@/components/auth-guard";
import DashboardContent from "@/components/dashboard-content";
import { requireAuth } from "@/lib/auth-pages";
import { getAuthenticatedRestaurantId } from "@/lib/auth-server";
import type { RestaurantId } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Protected route: /hoje (alias for /dashboard)
 * Redirects to /acesso if not authenticated
 */
export default async function HojePage() {
  // Require authentication - redirects if not authenticated
  const restaurant = await requireAuth();
  
  // Check for expired batches and register WASTE events
  const { checkAndRegisterExpiredBatches } = await import("@/app/actions");
  await checkAndRegisterExpiredBatches(restaurant.id);

  // Get restaurantId for DashboardContent (can be RestaurantId or restaurant.id)
  const restaurantId = await getAuthenticatedRestaurantId();

  return (
    <AuthGuard>
      <DashboardContent restaurantId={restaurantId as RestaurantId | string} />
    </AuthGuard>
  );
}
