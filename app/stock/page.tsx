import { db } from "@/lib/db";
import { getRestaurant } from "@/lib/data-access";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInCalendarDays } from "date-fns";
import { MapPin, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StockPage() {
  const restaurant = await getRestaurant();

  const batches = await db.productBatch.findMany({
    where: {
      restaurantId: restaurant.id,
    },
    include: {
      category: true,
      location: true,
    },
    orderBy: {
      expiryDate: "asc",
    },
  });

  const today = new Date();

  function getStatus(batch: (typeof batches)[number]) {
    const daysToExpiry = differenceInCalendarDays(
      new Date(batch.expiryDate),
      today
    );

    const urgentDays =
      batch.category?.alertDaysBeforeExpiry ??
      restaurant.alertDaysBeforeExpiry;

    const warningDays =
      batch.category?.warningDaysBeforeExpiry ?? urgentDays;

    if (daysToExpiry < 0) {
      return { label: "Expirado", variant: "destructive" as const };
    }

    if (daysToExpiry <= urgentDays) {
      return {
        label: `Urgente usar (${daysToExpiry} dias)`,
        variant: "destructive" as const,
      };
    }

    if (daysToExpiry <= warningDays) {
      return {
        label: `A expirar em breve (${daysToExpiry} dias)`,
        variant: "default" as const,
      };
    }

    return { label: "OK", variant: "secondary" as const };
  }

  // Agrupar batches por categoria
  const batchesByCategory = batches.reduce((acc, batch) => {
    const categoryName = batch.category?.name ?? "Sem Categoria";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(batch);
    return acc;
  }, {} as Record<string, typeof batches>);

  // Ordenar categorias (com produtos expirados/urgentes primeiro)
  const categoryNames = Object.keys(batchesByCategory).sort((a, b) => {
    const aHasUrgent = batchesByCategory[a].some(
      (b) => getStatus(b).variant === "destructive"
    );
    const bHasUrgent = batchesByCategory[b].some(
      (b) => getStatus(b).variant === "destructive"
    );
    if (aHasUrgent && !bHasUrgent) return -1;
    if (!aHasUrgent && bHasUrgent) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock"
        description="Lista de produtos em stock organizados por categoria."
      />

      {batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Ainda não existem produtos em stock</p>
            <p className="text-sm">Adicione uma entrada em &quot;Nova Entrada&quot;.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categoryNames.map((categoryName) => {
            const categoryBatches = batchesByCategory[categoryName];
            const urgentCount = categoryBatches.filter(
              (b) => getStatus(b).variant === "destructive"
            ).length;

            return (
              <Card key={categoryName} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">
                      {categoryName}
                    </CardTitle>
                    <Badge variant="outline" className="text-sm">
                      {categoryBatches.length}{" "}
                      {categoryBatches.length === 1 ? "produto" : "produtos"}
                      {urgentCount > 0 && (
                        <span className="ml-2 text-destructive">
                          ({urgentCount} urgente{urgentCount > 1 ? "s" : ""})
                        </span>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryBatches.map((batch) => {
                      const status = getStatus(batch);
                      
                      // Cores específicas para badges
                      const badgeClassName =
                        status.variant === "destructive"
                          ? "bg-red-500 hover:bg-red-600 text-white border-red-600"
                          : status.label.includes("A expirar")
                          ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                          : status.variant === "secondary"
                          ? "bg-green-500/10 hover:bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-500/50"
                          : "bg-secondary text-secondary-foreground";

                      return (
                        <div
                          key={batch.id}
                          className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                        >
                          {/* Nome do produto em destaque */}
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg font-semibold text-foreground">
                              {batch.name}
                            </h3>
                            <Badge className={badgeClassName}>
                              {status.label}
                            </Badge>
                          </div>

                          {/* Informações secundárias */}
                          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span className="font-medium text-foreground">
                                {batch.quantity} {batch.unit}
                              </span>
                            </div>
                            {batch.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{batch.location.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                Validade:
                              </span>
                              <span>
                                {format(new Date(batch.expiryDate), "dd/MM/yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
