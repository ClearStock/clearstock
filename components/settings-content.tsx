import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateSettings, createCategory, createLocation, deleteCategory, deleteLocation, updateCategoryAlert } from "@/app/actions";
import { Trash2 } from "lucide-react";
import type { Restaurant, Category, Location } from "@prisma/client";

interface SettingsContentProps {
  restaurant: Restaurant & {
    categories: Category[];
    locations: Location[];
  };
}

export default function SettingsContent({ restaurant }: SettingsContentProps) {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Definições" 
        description="Gerir configurações do restaurante"
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="locations">Localizações</TabsTrigger>
        </TabsList>
        
        {/* Tab: Geral */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Validade</CardTitle>
              <CardDescription>
                Configure quantos dias antes da validade mostrar alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateSettings} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="alertDays" className="text-sm font-medium">
                    Dias antes da validade
                  </label>
                  <Input
                    id="alertDays"
                    name="alertDays"
                    type="number"
                    min="1"
                    defaultValue={restaurant.alertDaysBeforeExpiry}
                    className="max-w-xs"
                  />
                </div>
                <Button type="submit">Guardar</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Categorias */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>
                Gerir categorias de produtos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={createCategory} className="flex gap-2">
                <Input
                  name="name"
                  placeholder="Nome da categoria"
                  className="flex-1"
                  required
                />
                <Button type="submit">Adicionar</Button>
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Categorias existentes</h3>
                <ul className="space-y-2">
                  {restaurant.categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{category.name}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div>
                            <label className="text-xs">Aviso urgente (dias):</label>
                            <form action={(formData) => updateCategoryAlert(category.id, formData)} className="inline-flex items-center gap-2 ml-2">
                              <Input
                                name="alertDays"
                                type="number"
                                min="0"
                                defaultValue={category.alertDaysBeforeExpiry ?? restaurant.alertDaysBeforeExpiry}
                                className="w-20 h-8"
                              />
                              <Button type="submit" size="sm" variant="ghost">Guardar</Button>
                            </form>
                          </div>
                          <div>
                            <label className="text-xs">Aviso (dias):</label>
                            <form action={(formData) => updateCategoryAlert(category.id, formData)} className="inline-flex items-center gap-2 ml-2">
                              <Input
                                name="warningDays"
                                type="number"
                                min="0"
                                defaultValue={category.warningDaysBeforeExpiry ?? restaurant.alertDaysBeforeExpiry}
                                className="w-20 h-8"
                              />
                              <Button type="submit" size="sm" variant="ghost">Guardar</Button>
                            </form>
                          </div>
                        </div>
                      </div>
                      <form action={deleteCategory.bind(null, category.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Localizações */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Localizações</CardTitle>
              <CardDescription>
                Gerir localizações de armazenamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={createLocation} className="flex gap-2">
                <Input
                  name="name"
                  placeholder="Nome da localização"
                  className="flex-1"
                  required
                />
                <Button type="submit">Adicionar</Button>
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Localizações existentes</h3>
                <ul className="space-y-2">
                  {restaurant.locations.map((location) => (
                    <li
                      key={location.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <p className="font-medium">{location.name}</p>
                      <form action={deleteLocation.bind(null, location.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

