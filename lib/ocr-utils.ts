/**
 * OCR utilities for extracting expiry dates from text
 */

/**
 * Parse OCR text and extract a plausible expiry date
 * Supports multiple date formats commonly found on product labels
 */
export function extractExpiryDate(text: string): Date | null {
  if (!text || typeof text !== "string") {
    return null;
  }

  // Normalize text: remove extra whitespace and common OCR errors
  const normalizedText = text
    .replace(/\s+/g, " ")
    .replace(/[|]/g, "1") // Common OCR error: | -> 1
    .replace(/[O]/g, "0") // Common OCR error: O -> 0 (in dates)
    .trim();

  // Date patterns to match (in order of preference)
  const datePatterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    {
      regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g,
      parser: (matches: RegExpMatchArray[]): Date | null => {
        for (const match of matches) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);

          if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime()) && date.getFullYear() === year) {
              return date;
            }
          }
        }
        return null;
      },
    },
    // DD/MM/YY or DD-MM-YY (2-digit year)
    {
      regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/g,
      parser: (matches: RegExpMatchArray[]): Date | null => {
        for (const match of matches) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const year2Digit = parseInt(match[3], 10);

          // Assume years 00-30 are 2000-2030, years 31-99 are 1931-1999
          const year = year2Digit <= 30 ? 2000 + year2Digit : 1900 + year2Digit;

          if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime()) && date.getFullYear() === year) {
              return date;
            }
          }
        }
        return null;
      },
    },
    // MM/YYYY or MM-YYYY (fallback if no full date)
    {
      regex: /(\d{1,2})[\/\-](\d{4})\b/g,
      parser: (matches: RegExpMatchArray[]): Date | null => {
        for (const match of matches) {
          const month = parseInt(match[1], 10);
          const year = parseInt(match[2], 10);

          if (month >= 1 && month <= 12) {
            // Use last day of month as expiry
            const date = new Date(year, month, 0); // Day 0 = last day of previous month
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
        return null;
      },
    },
  ];

  // Try each pattern
  for (const pattern of datePatterns) {
    const matches = Array.from(normalizedText.matchAll(pattern.regex));
    if (matches.length > 0) {
      const date = pattern.parser(matches);
      if (date && !isNaN(date.getTime())) {
        // Only return future dates or recent past dates (within last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (date >= thirtyDaysAgo) {
          return date;
        }
      }
    }
  }

  return null;
}

/**
 * Format date to YYYY-MM-DD for HTML date input
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date to DD/MM/YYYY for display
 */
export function formatDateForDisplay(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

