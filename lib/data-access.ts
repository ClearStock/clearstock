import { db } from "@/lib/db"
import { RESTAURANT_NAMES, type RestaurantId } from "@/lib/auth"

/**
 * Get or create restaurant by tenant ID (A, B, or C)
 */
export async function getRestaurantByTenantId(tenantId: RestaurantId) {
  // Try to find restaurant by tenantId (if exists) or by name
  let restaurant = await db.restaurant.findFirst({
    where: {
      OR: [
        // If tenantId field exists in schema
        // { tenantId },
        // Fallback to name matching
        { name: RESTAURANT_NAMES[tenantId] },
      ],
    },
    include: {
      categories: true,
      locations: true,
    },
  })

  if (restaurant) return restaurant

  // Create restaurant if it doesn't exist
  return await db.restaurant.create({
    data: {
      name: RESTAURANT_NAMES[tenantId],
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
}

/**
 * Legacy function - uses first restaurant found
 * @deprecated Use getRestaurantByTenantId instead
 */
export async function getRestaurant() {
  const restaurant = await db.restaurant.findFirst({
    include: {
      categories: true,
      locations: true,
    },
  })

  if (restaurant) return restaurant

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
