import { getRestaurantByTenantId } from "@/lib/data-access";
import NewEntryForm from "@/components/new-entry-form";
import { AuthGuard } from "@/components/auth-guard";
import { requireAuth } from "@/lib/auth-pages";

export const dynamic = "force-dynamic";

/**
 * Protected route: /nova-entrada (alias for /entries/new)
 * Redirects to /acesso if not authenticated
 */
export default async function NovaEntradaPage() {
  // Require authentication - redirects if not authenticated
  const restaurant = await requireAuth();

  return (
    <AuthGuard>
      <NewEntryForm
        restaurantId={restaurant.id}
        categories={restaurant.categories}
        locations={restaurant.locations}
      />
    </AuthGuard>
  );
}
