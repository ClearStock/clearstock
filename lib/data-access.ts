import { db } from "@/lib/db"

export async function getRestaurant() {
  try {
    const restaurant = await db.restaurant.findFirst({
      include: {
        categories: true,
        locations: true,
      },
    })

    if (restaurant) return restaurant

    // Se não existe, criar restaurante padrão
    return await db.restaurant.create({
      data: {
        name: "Meu Restaurante",
        alertDaysBeforeExpiry: 3,
        categories: {
          create: [
            { name: "Frescos" },
            { name: "Congelados" },
            { name: "Secos" },
          ],
        },
        locations: {
          create: [
            { name: "Frigorífico 1" },
            { name: "Despensa" },
            { name: "Arca" },
          ],
        },
      },
      include: {
        categories: true,
        locations: true,
      },
    })
  } catch (error) {
    console.error("Error getting restaurant:", error);
    throw new Error("Erro ao aceder à base de dados. Verifique a conexão.");
  }
}

export async function getUser(restaurantId: string) {
  const user = await db.user.findFirst({
    where: { restaurantId }
  })

  if (user) return user

  return await db.user.create({
    data: {
      name: "Demo User",
      email: "demo@example.com",
      restaurantId,
    }
  })
}
