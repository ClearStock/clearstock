"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getRestaurantByTenantId, getUser, getRestaurantByPin } from "@/lib/data-access";
import { RESTAURANT_NAMES, RESTAURANT_IDS, PIN_TO_RESTAURANT, normalizePIN, type RestaurantId } from "@/lib/auth";

/**
 * Helper to get restaurantId from cookies in server actions
 */
async function getRestaurantIdFromCookie(): Promise<RestaurantId | null> {
  const cookieStore = await cookies();
  const restaurantId = cookieStore.get("clearskok_restaurantId")?.value;
  
  if (restaurantId && RESTAURANT_IDS.includes(restaurantId as RestaurantId)) {
    return restaurantId as RestaurantId;
  }
  
  return null;
}

export async function updateSettings(formData: FormData) {
  const tenantId = await getRestaurantIdFromCookie();
  if (!tenantId) throw new Error("Não autenticado");

  const restaurant = await getRestaurantByTenantId(tenantId);

  const alertDaysRaw = formData.get("alertDays");
  const alertDays = Number(alertDaysRaw ?? 3);

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: {
      alertDaysBeforeExpiry: isNaN(alertDays) || alertDays <= 0 ? 3 : alertDays,
    },
  });

  revalidatePath("/definicoes", "page");
  revalidatePath("/settings", "page");
}

export async function getRestaurantNameByPin(pin: string) {
  try {
    const trimmedPin = pin.trim();
    // Normalize PIN (handle 4-digit backward compatibility)
    const normalizedPin = normalizePIN(trimmedPin);
    const restaurant = await getRestaurantByPin(normalizedPin);
    return restaurant?.name || null;
  } catch (error) {
    console.error("Error getting restaurant name by PIN:", error);
    return null;
  }
}

export async function validatePinAndLogin(pin: string) {
  try {
    const trimmedPin = pin.trim();
    
    // Normalize PIN (handle 4-digit backward compatibility)
    const normalizedPin = normalizePIN(trimmedPin);
    
    // Get restaurant by PIN
    const restaurant = await getRestaurantByPin(normalizedPin);
    
    if (!restaurant) {
      return {
        success: false,
        error: "PIN inválido. Tente novamente.",
      };
    }

    // Get the tenant ID from PIN mapping (for cookie compatibility)
    const tenantId = PIN_TO_RESTAURANT[normalizedPin];
    
    if (!tenantId) {
      return {
        success: false,
        error: "PIN não está associado a um restaurante válido.",
      };
    }

    // Set cookie for server components
    const cookieStore = await cookies();
    cookieStore.set("clearskok_restaurantId", tenantId, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
    });

    return {
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        pin: restaurant.pin,
      },
      needsOnboarding: !restaurant.name,
    };
  } catch (error) {
    console.error("Error validating PIN:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao validar PIN.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updateRestaurantName(formData: FormData) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) {
      return {
        success: false,
        error: "Não autenticado. Por favor, faça login novamente.",
      };
    }

    const restaurant = await getRestaurantByTenantId(tenantId);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return {
        success: false,
        error: "Por favor, forneça um nome para o restaurante.",
      };
    }

    await db.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name,
      },
    });

    revalidatePath("/onboarding", "page");
    revalidatePath("/definicoes", "page");
    revalidatePath("/settings", "page");
    revalidatePath("/hoje", "page");
    revalidatePath("/dashboard", "page");

    return {
      success: true,
      message: `Nome do restaurante atualizado para "${name}"!`,
    };
  } catch (error) {
    console.error("Error updating restaurant name:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao atualizar nome do restaurante.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function createCategory(formData: FormData) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) {
      return {
        success: false,
        error: "Não autenticado. Por favor, faça login novamente.",
      };
    }

    const restaurant = await getRestaurantByTenantId(tenantId);
    const name = String(formData.get("name") ?? "").trim();
    const tipoRaw = String(formData.get("tipo") ?? "mp").trim();
    const tipo = (tipoRaw === "transformado" ? "transformado" : "mp") as "mp" | "transformado";

    if (!name) {
      return {
        success: false,
        error: "Por favor, forneça um nome para a categoria.",
      };
    }

    // Check if category already exists for this restaurant and tipo
    const existingCategory = await db.category.findFirst({
      where: {
        restaurantId: restaurant.id,
        name: name,
        tipo: tipo,
      },
    });

    if (existingCategory) {
      return {
        success: false,
        error: `A categoria "${name}" já existe para ${tipo === "mp" ? "matérias-primas" : "transformados"}.`,
      };
    }

    await db.category.create({
      data: {
        name,
        tipo,
        restaurantId: restaurant.id,
      },
    });

    // Only revalidate settings page - categories/locations appear in forms via server components
    revalidatePath("/definicoes", "page");
    revalidatePath("/settings", "page");

    return {
      success: true,
      message: `Categoria "${name}" criada com sucesso!`,
    };
  } catch (error) {
    console.error("Error creating category:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao criar categoria.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function createLocation(formData: FormData) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) {
      return {
        success: false,
        error: "Não autenticado. Por favor, faça login novamente.",
      };
    }

    const restaurant = await getRestaurantByTenantId(tenantId);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      return {
        success: false,
        error: "Por favor, forneça um nome para a localização.",
      };
    }

    // Check if location already exists for this restaurant
    const existingLocation = await db.location.findFirst({
      where: {
        restaurantId: restaurant.id,
        name: name,
      },
    });

    if (existingLocation) {
      return {
        success: false,
        error: `A localização "${name}" já existe.`,
      };
    }

    await db.location.create({
      data: {
        name,
        restaurantId: restaurant.id,
      },
    });

    // Only revalidate settings page - locations appear in forms via server components
    revalidatePath("/definicoes", "page");
    revalidatePath("/settings", "page");

    return {
      success: true,
      message: `Localização "${name}" criada com sucesso!`,
    };
  } catch (error) {
    console.error("Error creating location:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao criar localização.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updateCategoryAlert(categoryId: string, formData: FormData) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) throw new Error("Não autenticado");

    const warningRaw = formData.get("warningDays");
    const urgentRaw = formData.get("alertDays");

    const warning =
      warningRaw && !isNaN(Number(warningRaw)) && Number(warningRaw) >= 0
        ? Number(warningRaw)
        : null;

    const urgent =
      urgentRaw && !isNaN(Number(urgentRaw)) && Number(urgentRaw) >= 0
        ? Number(urgentRaw)
        : null;

    await db.category.update({
      where: { 
        id: categoryId,
        restaurant: { name: RESTAURANT_NAMES[tenantId] },
      },
      data: {
        warningDaysBeforeExpiry: warning,
        alertDaysBeforeExpiry: urgent,
      },
    });

    revalidatePath("/definicoes", "page");
    revalidatePath("/settings", "page");
  } catch (error) {
    console.error("Error updating category alert:", error);
    throw error;
  }
}

/**
 * Server action wrappers to avoid passing functions to client components
 * These use hidden form fields to pass IDs
 */

export async function updateCategoryAlertById(formData: FormData) {
  "use server";
  const categoryId = formData.get("categoryId")?.toString();
  const warningDays = formData.get("warningDays")?.toString();
  const alertDays = formData.get("alertDays")?.toString();
  
  if (!categoryId) throw new Error("Category ID required");
  
  // Create new FormData with the values
  const newFormData = new FormData();
  if (warningDays) newFormData.set("warningDays", warningDays);
  if (alertDays) newFormData.set("alertDays", alertDays);
  
  return updateCategoryAlert(categoryId, newFormData);
}

export async function deleteCategoryById(formData: FormData) {
  "use server";
  const categoryId = formData.get("categoryId")?.toString();
  if (!categoryId) throw new Error("Category ID required");
  return deleteCategory(categoryId);
}

export async function deleteLocationById(formData: FormData) {
  "use server";
  const locationId = formData.get("locationId")?.toString();
  if (!locationId) throw new Error("Location ID required");
  return deleteLocation(locationId);
}

export async function deleteCategory(categoryId: string) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) throw new Error("Não autenticado");

    await db.category.delete({
      where: { 
        id: categoryId,
        restaurant: { name: RESTAURANT_NAMES[tenantId] },
      },
    });

    revalidatePath("/definicoes", "page");
    revalidatePath("/settings", "page");
    revalidatePath("/stock", "page");
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

export async function deleteLocation(locationId: string) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) throw new Error("Não autenticado");

    await db.location.delete({
      where: { 
        id: locationId,
        restaurant: { name: RESTAURANT_NAMES[tenantId] },
      },
    });

    revalidatePath("/definicoes", "page");
    revalidatePath("/settings", "page");
    revalidatePath("/stock", "page");
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
}

/**
 * Server action para criar nova entrada de produto
 * Retorna objeto com sucesso/erro para facilitar feedback no client
 */
export async function createProductBatch(formData: FormData) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) {
      return {
        success: false,
        error: "Não autenticado. Por favor, faça login novamente.",
      };
    }

    const restaurant = await getRestaurantByTenantId(tenantId);
    const user = await getUser(restaurant.id);

    const name = String(formData.get("name") ?? "").trim();
    const quantityRaw = formData.get("quantity");
    const unitRaw = String(formData.get("unit") ?? "").trim();
    const expiryDateRaw = formData.get("expiryDate");
    const tipoRaw = String(formData.get("tipo") ?? "mp").trim();
    const tipo = (tipoRaw === "transformado" ? "transformado" : "mp") as "mp" | "transformado";
    const categoryIdRaw = formData.get("categoryId");
    const locationIdRaw = formData.get("locationId");
    const packagingTypeRaw = formData.get("packagingType");
    const sizeRaw = formData.get("size");
    const sizeUnitRaw = formData.get("sizeUnit");

    if (!name || !quantityRaw || !expiryDateRaw) {
      return {
        success: false,
        error: "Por favor, preencha todos os campos obrigatórios (nome, quantidade e data de validade).",
      };
    }

    const quantity = Number(quantityRaw);
    const unit = unitRaw || "un";
    const expiryDate = new Date(String(expiryDateRaw));

    if (isNaN(expiryDate.getTime())) {
      return {
        success: false,
        error: "Data de validade inválida. Por favor, selecione uma data válida.",
      };
    }

    // Optional fields
    const packagingType = packagingTypeRaw && String(packagingTypeRaw).trim() !== "" ? String(packagingTypeRaw).trim() : null;
    const sizeRawValue = sizeRaw && String(sizeRaw).trim() !== "" ? String(sizeRaw).trim() : null;
    const size = sizeRawValue && !isNaN(Number(sizeRawValue)) && Number(sizeRawValue) > 0 ? Number(sizeRawValue) : null;
    const sizeUnit = size && sizeUnitRaw && String(sizeUnitRaw).trim() !== "" ? String(sizeUnitRaw).trim() : null;

    const finalQuantity = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    
    await db.productBatch.create({
      data: {
        name,
        quantity: finalQuantity,
        unit,
        expiryDate,
        tipo,
        restaurantId: restaurant.id,
        userId: user.id,
        categoryId: categoryIdRaw && String(categoryIdRaw).trim() !== "" ? String(categoryIdRaw) : null,
        locationId: locationIdRaw && String(locationIdRaw).trim() !== "" ? String(locationIdRaw) : null,
        packagingType,
        size,
        sizeUnit,
      },
    });

    // Register ENTRY event for history tracking
    try {
      await db.stockEvent.create({
        data: {
          restaurantId: restaurant.id,
          type: "ENTRY",
          productName: name,
          quantity: finalQuantity,
          unit,
        },
      });
    } catch (eventError) {
      // Don't fail the whole operation if event creation fails
      console.error("Error creating stock event:", eventError);
    }

    // Only revalidate paths that actually need to be updated
    revalidatePath("/stock", "page");
    revalidatePath("/hoje", "page");

    return {
      success: true,
      message: `Entrada "${name}" adicionada com sucesso ao stock!`,
    };
  } catch (error) {
    console.error("Error creating product batch:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao guardar entrada.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updateProductBatch(batchId: string, formData: FormData) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) throw new Error("Não autenticado");

    if (!batchId) {
      throw new Error("ID do batch não fornecido");
    }

    const name = String(formData.get("name") ?? "").trim();
    const quantityRaw = formData.get("quantity");
    const unitRaw = String(formData.get("unit") ?? "").trim();
    const expiryDateRaw = formData.get("expiryDate");
    const tipoRaw = String(formData.get("tipo") ?? "mp").trim();
    const tipo = (tipoRaw === "transformado" ? "transformado" : "mp") as "mp" | "transformado";
    const categoryIdRaw = formData.get("categoryId");
    const locationIdRaw = formData.get("locationId");
    const packagingTypeRaw = formData.get("packagingType");
    const sizeRaw = formData.get("size");
    const sizeUnitRaw = formData.get("sizeUnit");

    if (!name || !quantityRaw || !expiryDateRaw) {
      throw new Error("Campos obrigatórios em falta");
    }

    const quantity = Number(quantityRaw);
    const unit = unitRaw || "un";
    const expiryDateString = String(expiryDateRaw);
    const expiryDate = new Date(expiryDateString);

    if (isNaN(expiryDate.getTime())) {
      throw new Error("Data de validade inválida");
    }

    // Converter categoryId e locationId: se vazio ou "undefined", usar null
    const categoryId =
      categoryIdRaw && String(categoryIdRaw).trim() !== ""
        ? String(categoryIdRaw)
        : null;
    const locationId =
      locationIdRaw && String(locationIdRaw).trim() !== ""
        ? String(locationIdRaw)
        : null;

    // Optional fields
    const packagingType = packagingTypeRaw && String(packagingTypeRaw).trim() !== "" ? String(packagingTypeRaw).trim() : null;
    const sizeRawValue = sizeRaw && String(sizeRaw).trim() !== "" ? String(sizeRaw).trim() : null;
    const size = sizeRawValue && !isNaN(Number(sizeRawValue)) && Number(sizeRawValue) > 0 ? Number(sizeRawValue) : null;
    const sizeUnit = size && sizeUnitRaw && String(sizeUnitRaw).trim() !== "" ? String(sizeUnitRaw).trim() : null;

    await db.productBatch.update({
      where: { id: batchId },
      data: {
        name,
        quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
        unit,
        expiryDate,
        tipo,
        categoryId,
        locationId,
        packagingType,
        size,
        sizeUnit,
      },
    });

    revalidatePath("/stock", "page");
  } catch (error) {
    console.error("Error updating product batch:", error);
    throw error; // Re-throw para o client conseguir capturar
  }
}

export async function deleteProductBatch(batchId: string) {
  const tenantId = await getRestaurantIdFromCookie();
  if (!tenantId) throw new Error("Não autenticado");

  // Get batch info before deleting to register WASTE event
  const batch = await db.productBatch.findUnique({
    where: { id: batchId },
    include: { restaurant: true },
  });

  if (batch && batch.quantity > 0) {
    // Register WASTE event for history tracking
    try {
      await db.stockEvent.create({
        data: {
          restaurantId: batch.restaurantId,
          type: "WASTE",
          productName: batch.name,
          quantity: batch.quantity,
          unit: batch.unit,
        },
      });
    } catch (eventError) {
      // Don't fail the whole operation if event creation fails
      console.error("Error creating waste event:", eventError);
    }
  }

  await db.productBatch.delete({
    where: { id: batchId },
  });

  revalidatePath("/stock", "page");
}

/**
 * Server action para ajustar quantidade de um batch
 * Pode aumentar ou diminuir quantidade
 * Se quantity <= 0, marca como USED e define quantity = 0
 */
export async function adjustBatchQuantity(batchId: string, adjustment: number) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) {
      return {
        success: false,
        error: "Não autenticado. Por favor, faça login novamente.",
      };
    }

    // Get current batch
    const batch = await db.productBatch.findFirst({
      where: {
        id: batchId,
        restaurant: { name: RESTAURANT_NAMES[tenantId] },
      },
    });

    if (!batch) {
      return {
        success: false,
        error: "Entrada não encontrada.",
      };
    }

    // Calculate new quantity
    const newQuantity = Math.max(0, batch.quantity + adjustment);
    const wastedQuantity = adjustment < 0 ? Math.abs(adjustment) : 0;

    // Register WASTE event if quantity is being reduced (waste/expiry)
    // Only register if we're actually reducing quantity (not just consuming normally)
    if (wastedQuantity > 0 && batch.quantity > 0) {
      try {
        await db.stockEvent.create({
          data: {
            restaurantId: batch.restaurantId,
            type: "WASTE",
            productName: batch.name,
            quantity: Math.min(wastedQuantity, batch.quantity), // Don't register more than was available
            unit: batch.unit,
          },
        });
      } catch (eventError) {
        // Don't fail the whole operation if event creation fails
        console.error("Error creating waste event:", eventError);
      }
    }

    // Update batch
    await db.productBatch.update({
      where: { id: batchId },
      data: {
        quantity: newQuantity,
        // Mark as USED if quantity reaches 0
        status: newQuantity <= 0 ? "USED" : batch.status === "USED" ? "ACTIVE" : batch.status,
      },
    });

    // Revalidate pages that show stock data (dashboard is same as hoje)
    revalidatePath("/stock", "page");
    revalidatePath("/hoje", "page");

    return {
      success: true,
      message: `Quantidade ajustada para ${newQuantity} ${batch.unit}`,
    };
  } catch (error) {
    console.error("Error adjusting batch quantity:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao ajustar quantidade.";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Server action to get stock events for a specific month
 */
export async function getStockEventsForMonthAction(year: number, month: number) {
  try {
    const tenantId = await getRestaurantIdFromCookie();
    if (!tenantId) {
      return {
        success: false,
        error: "Não autenticado",
        events: [],
      };
    }

    const restaurant = await getRestaurantByTenantId(tenantId);
    const { getStockEventsForMonth } = await import("@/lib/history-utils");
    const events = await getStockEventsForMonth(restaurant.id, year, month);

    return {
      success: true,
      events: events.map(e => ({
        type: e.type,
        productName: e.productName,
        quantity: e.quantity,
        unit: e.unit,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error getting stock events:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      events: [],
    };
  }
}

