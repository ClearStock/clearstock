import { db } from "@/lib/db";
import { getRestaurantByTenantId } from "@/lib/data-access";
import { PageHeader } from "@/components/page-header";
import { StockViewWrapper } from "@/components/stock-view-wrapper";
import { AuthGuard } from "@/components/auth-guard";
import { requireAuth } from "@/lib/auth-pages";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Stock page - Protected route
 * Busca dados do servidor e passa para o componente client StockView
 * que gere toda a lógica de UI, estado e interações.
 */
export default async function StockPage() {
  // Require authentication - redirects if not authenticated
  const restaurant = await requireAuth();

  // Check for expired batches and register WASTE events
  const { checkAndRegisterExpiredBatches } = await import("@/app/actions");
  await checkAndRegisterExpiredBatches(restaurant.id);

  // Optimize query: select only needed fields to reduce payload size
  const batches = await db.productBatch.findMany({
    where: {
      restaurantId: restaurant.id,
      // Fetch all batches; client component will filter by quantity
    },
    select: {
      id: true,
      name: true,
      quantity: true,
      unit: true,
      expiryDate: true,
      packagingType: true,
      size: true,
      sizeUnit: true,
      tipo: true,
      status: true,
      restaurantId: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          tipo: true,
          alertDaysBeforeExpiry: true,
          warningDaysBeforeExpiry: true,
          restaurantId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          restaurantId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title="Stock"
          description="Lista de produtos em stock organizados por categoria ou por produto."
        />

        <StockViewWrapper
          batches={batches}
          restaurant={restaurant}
          categories={restaurant.categories}
          locations={restaurant.locations}
        />
      </div>
    </AuthGuard>
  );
}
