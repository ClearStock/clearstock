/**
 * Voice Command Parser
 * 
 * Parses natural language commands in Portuguese to extract:
 * - Product name
 * - Quantity and unit
 * - Expiry date (relative days)
 * - Other optional fields
 * 
 * Examples:
 * - "Adicionar 5 kg de leite com validade em 3 dias"
 * - "10 unidades de arroz válido até daqui a 7 dias"
 * - "3 litros de azeite expira hoje"
 * - "Leite meio-gordo 2 litros válido em 5 dias"
 */

interface ParsedCommand {
  name?: string;
  quantity?: string;
  unit?: string;
  expiryDays?: number;
  expiryDate?: string; // ISO date string
  category?: string;
  location?: string;
  homemade?: boolean;
}

/**
 * Parse a voice command and extract product information
 */
export function parseVoiceCommand(text: string): ParsedCommand {
  const result: ParsedCommand = {};
  const lowerText = text.toLowerCase().trim();

  // Extract quantity and unit
  const quantityMatch = extractQuantityAndUnit(lowerText);
  if (quantityMatch) {
    result.quantity = quantityMatch.quantity;
    result.unit = quantityMatch.unit;
  }

  // Extract expiry date/days
  const expiryMatch = extractExpiryDate(lowerText);
  if (expiryMatch) {
    if (expiryMatch.days !== undefined) {
      result.expiryDays = expiryMatch.days;
      result.expiryDate = calculateExpiryDate(expiryMatch.days);
    } else if (expiryMatch.date) {
      result.expiryDate = expiryMatch.date;
    }
  }

  // Extract product name (usually after "de" or at the end)
  result.name = extractProductName(lowerText, quantityMatch);

  // Extract homemade indicator
  if (lowerText.includes("feito na casa") || lowerText.includes("feito em casa") || lowerText.includes("caseiro")) {
    result.homemade = true;
  }

  // Extract category hints (optional, can be improved)
  const categoryMatch = extractCategory(lowerText);
  if (categoryMatch) {
    result.category = categoryMatch;
  }

  return result;
}

/**
 * Extract quantity and unit from text
 * Examples: "5 kg", "10 unidades", "3 litros", "2.5 kg"
 */
function extractQuantityAndUnit(text: string): { quantity: string; unit: string } | null {
  // Pattern: number + unit
  const patterns = [
    // "5 kg", "10 kg", "2.5 kg"
    /(\d+(?:[.,]\d+)?)\s*(?:kg|quilograma|quilogramas|kilo|kilos)/i,
    // "3 litros", "1 litro", "500 ml", "250 ml"
    /(\d+(?:[.,]\d+)?)\s*(?:l|litro|litros|ml|mililitro|mililitros)/i,
    // "10 unidades", "5 un", "2 unidades"
    /(\d+(?:[.,]\d+)?)\s*(?:un|unidade|unidades|uni)/i,
    // "3 peças", "2 peça"
    /(\d+(?:[.,]\d+)?)\s*(?:peça|peças)/i,
    // "1 pacote", "2 pacotes"
    /(\d+(?:[.,]\d+)?)\s*(?:pacote|pacotes)/i,
    // Just a number (default to "un")
    /^(\d+(?:[.,]\d+)?)(?:\s|$)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const quantity = match[1].replace(",", ".");
      let unit = "un";

      // Determine unit from match
      if (pattern.source.includes("kg|quilograma")) {
        unit = "kg";
      } else if (pattern.source.includes("l|litro|ml")) {
        const fullMatch = match[0].toLowerCase();
        if (fullMatch.includes("ml") || fullMatch.includes("mililitro")) {
          unit = "ml";
        } else {
          unit = "L";
        }
      } else if (pattern.source.includes("un|unidade")) {
        unit = "un";
      } else if (pattern.source.includes("peça")) {
        unit = "un";
      } else if (pattern.source.includes("pacote")) {
        unit = "un";
      }

      return { quantity, unit };
    }
  }

  return null;
}

/**
 * Extract expiry date information
 * Examples: "em 3 dias", "daqui a 7 dias", "hoje", "amanhã", "+1 dia"
 */
function extractExpiryDate(text: string): { days?: number; date?: string } | null {
  // "hoje" or "expira hoje"
  if (text.includes("hoje") || text.includes("expira hoje") || text.includes("válido hoje")) {
    return { days: 0 };
  }

  // "amanhã" or "+1 dia" or "em 1 dia"
  if (text.includes("amanhã") || text.includes("+1 dia") || text.includes("em 1 dia") || text.includes("daqui a 1 dia")) {
    return { days: 1 };
  }

  // "em X dias" or "daqui a X dias" or "+X dias"
  const daysPatterns = [
    /(?:em|daqui a|dentro de|válido em|expira em)\s*(\d+)\s*(?:dia|dias)/i,
    /\+(\d+)\s*(?:dia|dias)/i,
    /(\d+)\s*(?:dia|dias)\s*(?:de validade|para expirar)/i,
  ];

  for (const pattern of daysPatterns) {
    const match = text.match(pattern);
    if (match) {
      const days = parseInt(match[1], 10);
      if (!isNaN(days) && days >= 0 && days <= 365) {
        return { days };
      }
    }
  }

  // "em 3 dias" (simpler pattern)
  const simpleDaysMatch = text.match(/(\d+)\s*dias?/i);
  if (simpleDaysMatch) {
    const days = parseInt(simpleDaysMatch[1], 10);
    if (!isNaN(days) && days >= 0 && days <= 365) {
      return { days };
    }
  }

  return null;
}

/**
 * Calculate expiry date from days offset
 */
function calculateExpiryDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

/**
 * Extract product name from text
 * Usually appears after "de" or at the end of the sentence
 */
function extractProductName(text: string, quantityMatch: { quantity: string; unit: string } | null): string {
  // Remove common command words
  let cleaned = text
    .replace(/adicionar|adiciona|adicionar ao stock|adicionar produto/gi, "")
    .replace(/com validade|válido|expira|válido até|válido em|expira em|expira daqui/gi, "")
    .replace(/em \d+ dias?|daqui a \d+ dias?|\+?\d+ dias?/gi, "")
    .replace(/hoje|amanhã/gi, "")
    .replace(/feito na casa|feito em casa|caseiro/gi, "")
    .trim();

  // Remove quantity and unit if found
  if (quantityMatch) {
    const qtyPattern = new RegExp(
      `\\b${quantityMatch.quantity.replace(".", "\\.")}\\s*${quantityMatch.unit}\\b`,
      "gi"
    );
    cleaned = cleaned.replace(qtyPattern, "");
  }

  // Remove "de" at the beginning if it's just a connector
  cleaned = cleaned.replace(/^\s*de\s+/i, "");

  // Remove common words
  cleaned = cleaned
    .replace(/\b(unidade|unidades|un|kg|quilograma|litro|litros|ml|mililitro)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Capitalize first letter of each word
  if (cleaned) {
    return cleaned
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  return "";
}

/**
 * Extract category hints (optional, can be improved with better matching)
 */
function extractCategory(text: string): string | null {
  const categoryKeywords: Record<string, string> = {
    "fresco": "Frescos",
    "frescos": "Frescos",
    "congelado": "Congelados",
    "congelados": "Congelados",
    "seco": "Secos",
    "secos": "Secos",
  };

  for (const [keyword, category] of Object.entries(categoryKeywords)) {
    if (text.includes(keyword)) {
      return category;
    }
  }

  return null;
}

