import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getRestaurantByTenantId } from "@/lib/data-access";
import { RESTAURANT_IDS, type RestaurantId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const restaurantIdCookie = cookieStore.get("clearskok_restaurantId")?.value;

    if (!restaurantIdCookie || !RESTAURANT_IDS.includes(restaurantIdCookie as RestaurantId)) {
      return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
    }

    const restaurant = await getRestaurantByTenantId(restaurantIdCookie as RestaurantId);
    const { searchParams } = new URL(request.url);
    const requestedRestaurantId = searchParams.get("restaurantId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Verify restaurant ID matches
    if (requestedRestaurantId !== restaurant.id) {
      return NextResponse.json({ ok: false, error: "Restaurante inválido" }, { status: 403 });
    }

    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ ok: false, error: "Datas inválidas" }, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ ok: false, error: "Datas inválidas" }, { status: 400 });
    }

    // Fetch events for the date range
    const events = await db.stockEvent.findMany({
      where: {
        restaurantId: restaurant.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      ok: true,
      events: events.map((event) => ({
        id: event.id,
        type: event.type,
        productName: event.productName,
        quantity: event.quantity,
        unit: event.unit,
        createdAt: event.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao carregar histórico" },
      { status: 500 }
    );
  }
}

