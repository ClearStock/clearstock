import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getRestaurantByTenantId } from "@/lib/data-access";
import { RESTAURANT_IDS, type RestaurantId } from "@/lib/auth";
import { sendSupportEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

type SupportType = "bug" | "suggestion" | "question" | "other";

interface SupportRequest {
  type: SupportType;
  message: string;
  contact: string;
  restaurantId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const restaurantIdCookie = cookieStore.get("clearskok_restaurantId")?.value;

    if (!restaurantIdCookie || !RESTAURANT_IDS.includes(restaurantIdCookie as RestaurantId)) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SupportRequest = await request.json();
    const { type, message, contact, restaurantId } = body;

    // Validate fields
    if (!type || !["bug", "suggestion", "question", "other"].includes(type)) {
      return NextResponse.json(
        { ok: false, error: "Tipo de mensagem inválido" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Mensagem é obrigatória" },
        { status: 400 }
      );
    }

    if (!contact || contact.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Contacto é obrigatório" },
        { status: 400 }
      );
    }

    // Verify restaurant exists and matches authenticated user
    const restaurant = await getRestaurantByTenantId(restaurantIdCookie as RestaurantId);
    
    if (restaurant.id !== restaurantId) {
      return NextResponse.json(
        { ok: false, error: "Restaurante não corresponde à autenticação" },
        { status: 403 }
      );
    }

    // Save support message to database
    const supportMessage = await db.supportMessage.create({
      data: {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        type: type as SupportType,
        message: message.trim(),
        contact: contact.trim(),
      },
    });

    // Send email to admin
    try {
      await sendSupportEmail({
        restaurantName: restaurant.name,
        restaurantPin: restaurant.pin,
        type,
        message: message.trim(),
        contact: contact.trim(),
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Error sending support email:", emailError);
      // Continue - message is saved in DB even if email fails
    }

    return NextResponse.json({ ok: true, id: supportMessage.id });
  } catch (error) {
    console.error("Error processing support request:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao processar pedido de suporte" },
      { status: 500 }
    );
  }
}

