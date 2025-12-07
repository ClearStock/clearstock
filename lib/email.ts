import { Resend } from "resend";

const ADMIN_EMAIL = process.env.SUPPORT_ADMIN_EMAIL || "clear.stock.pt@gmail.com";
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@clearstok.app";

// Lazy initialization to avoid build-time errors
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

interface SupportEmailData {
  restaurantName: string | null;
  restaurantPin: string;
  type: "bug" | "suggestion" | "question" | "other";
  message: string;
  contact: string;
}

const TYPE_LABELS: Record<SupportEmailData["type"], string> = {
  bug: "Problema / bug",
  suggestion: "Sugestão",
  question: "Dúvida",
  other: "Outro",
};

export async function sendSupportEmail(data: SupportEmailData) {
  const resend = getResend();
  
  // If Resend API key is not configured, log and skip
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email send");
    console.log("Support message would be sent:", data);
    return;
  }

  const restaurantDisplay = data.restaurantName || `PIN ${data.restaurantPin}`;
  const subject = `Novo pedido de suporte - ${restaurantDisplay}`;

  const emailBody = `
Novo pedido de suporte da Clearstok:

Restaurante: ${restaurantDisplay}
PIN: ${data.restaurantPin}
Tipo: ${TYPE_LABELS[data.type]}
Contacto: ${data.contact}

Mensagem:

${data.message}
`.trim();

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject,
      text: emailBody,
    });

    console.log(`Support email sent to ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("Error sending support email:", error);
    throw error;
  }
}
