import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedRestaurantId } from "@/lib/auth-server";
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
    // Verify authentication using centralized helper
    const restaurantId = await getAuthenticatedRestaurantId();

    if (!restaurantId) {
      return NextResponse.json(
        { ok: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SupportRequest = await request.json();
    const { type, message, contact, restaurantId: bodyRestaurantId } = body;

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

    // Verify restaurant ID matches authenticated session
    if (restaurantId !== bodyRestaurantId) {
      return NextResponse.json(
        { ok: false, error: "Restaurante não corresponde à autenticação" },
        { status: 403 }
      );
    }

    // Get restaurant for email
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, pin: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { ok: false, error: "Restaurante não encontrado" },
        { status: 404 }
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
    let emailSent = false;
    try {
      console.log("[API] Attempting to send support email...");
      await sendSupportEmail({
        restaurantName: restaurant.name,
        restaurantPin: restaurant.pin,
        type,
        message: message.trim(),
        contact: contact.trim(),
      });
      emailSent = true;
      console.log("[API] ✅ Support email sent successfully");
    } catch (emailError: any) {
      // Log email error but don't fail the request
      console.error("[API] ❌ Error sending support email:");
      console.error("[API] Error type:", emailError?.constructor?.name);
      console.error("[API] Error message:", emailError?.message);
      console.error("[API] Full error:", JSON.stringify(emailError, null, 2));
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
