import { getRestaurantByTenantId } from "@/lib/data-access";
import { AuthGuard } from "@/components/auth-guard";
import { requireAuth } from "@/lib/auth-pages";
import { HistoryContent } from "@/components/history-content";

export const dynamic = "force-dynamic";

/**
 * Histórico & Encomendas page - Protected route
 * Shows monthly history (ENTRY and WASTE events) for decision making
 */
export default async function HistoricoPage() {
  // Require authentication - redirects if not authenticated
  const restaurant = await requireAuth();

  // Check for expired batches and register WASTE events
  const { checkAndRegisterExpiredBatches } = await import("@/app/actions");
  await checkAndRegisterExpiredBatches(restaurant.id);

  return (
    <AuthGuard>
      <HistoryContent restaurantId={restaurant.id} />
    </AuthGuard>
  );
}
