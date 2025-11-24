import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AuthGuard } from "@/components/auth-guard";
import DashboardContent from "@/components/dashboard-content";
import { RESTAURANT_IDS, type RestaurantId } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Protected route: /hoje (alias for /dashboard)
 * Redirects to /acesso if not authenticated
 */
export default async function HojePage() {
  // Check authentication via cookie (set by client)
  const cookieStore = await cookies();
  const restaurantId = cookieStore.get("clearskok_restaurantId")?.value;

  if (!restaurantId || !RESTAURANT_IDS.includes(restaurantId as RestaurantId)) {
    redirect("/acesso");
  }

  return (
    <AuthGuard>
      <DashboardContent restaurantId={restaurantId as RestaurantId} />
    </AuthGuard>
  );
}

