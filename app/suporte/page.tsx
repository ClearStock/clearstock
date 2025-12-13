import { getRestaurantByTenantId } from "@/lib/data-access";
import { AuthGuard } from "@/components/auth-guard";
import { requireAuth } from "@/lib/auth-pages";
import SupportForm from "@/components/support-form";

export const dynamic = "force-dynamic";

/**
 * Support page - Only accessible after PIN login
 */
export default async function SuportePage() {
  // Require authentication - redirects if not authenticated
  const restaurant = await requireAuth();

  return (
    <AuthGuard>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Suporte & Feedback</h1>
          <p className="text-muted-foreground mt-2">
            Conte-nos se algo não está a funcionar bem ou se tem sugestões de melhoria.
          </p>
        </div>
        <SupportForm restaurantId={restaurant.id} restaurantName={restaurant.name} />
      </div>
    </AuthGuard>
  );
}
