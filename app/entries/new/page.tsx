import { getRestaurant } from "@/lib/data-access";
import NewEntryForm from "@/components/new-entry-form";

export const dynamic = "force-dynamic";

export default async function NewEntryPage() {
  try {
    const restaurant = await getRestaurant();

    return (
      <NewEntryForm
        restaurantId={restaurant.id}
        categories={restaurant.categories}
        locations={restaurant.locations}
      />
    );
  } catch (error) {
    console.error("Error loading new entry page:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Entrada</h1>
          <p className="text-muted-foreground">
            Adicione um novo produto ao stock.
          </p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-12 text-center text-destructive">
          <p className="text-lg font-medium mb-2">
            Erro ao carregar formulário
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, recarregue a página ou contacte o suporte.
          </p>
        </div>
      </div>
    );
  }
}
