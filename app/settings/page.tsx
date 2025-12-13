import { getRestaurantByTenantId } from "@/lib/data-access";
import SettingsContent from "@/components/settings-content";
import { AuthGuard } from "@/components/auth-guard";
import { requireAuth } from "@/lib/auth-pages";

export const dynamic = "force-dynamic";

/**
 * Protected route: /settings (alias for /definicoes)
 * Redirects to /acesso if not authenticated
 */
export default async function SettingsPage() {
  // Require authentication - redirects if not authenticated
  const restaurant = await requireAuth();

  return (
    <AuthGuard>
      <SettingsContent restaurant={restaurant} />
    </AuthGuard>
  );
}
