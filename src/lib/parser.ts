/**
 * Bundle Parser Utility
 * Extracts phone numbers and gig amounts from raw text
 */

interface ParsedBundle {
  phoneNumber: string;
  gigAmount: number;
  rawLine: string;
}

/**
 * Normalizes gig amounts to standard format
 * "5" -> 5, "5GB" -> 5, "5gb" -> 5, "5 GB" -> 5
 */
export function normalizeGigAmount(text: string): number | null {
  // Remove common suffixes and whitespace
  const cleaned = text
    .trim()
    .replace(/\s*(gb|gigs?|gigabytes?)\s*/i, "")
    .trim();

  const amount = parseFloat(cleaned);
  
  if (isNaN(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

/**
 * Extracts 10-digit phone numbers from text
 * Handles various formats: 0557574477, +2340557574477, 2340557574477, etc.
 */
export function extractPhoneNumber(text: string): string | null {
  // Try to extract 10-digit number
  const tenDigitMatch = text.match(/\b(\d{10})\b/);
  if (tenDigitMatch) {
    return tenDigitMatch[1];
  }

  // Try to extract from longer patterns (11 or 13 digits starting with country code)
  const countryMatch = text.match(/(?:\+?234|0)?(\d{10})\b/);
  if (countryMatch) {
    return countryMatch[1];
  }

  return null;
}

/**
 * Main parser function
 * Takes raw text input and returns array of parsed bundles
 */
export function parseRawInput(rawText: string): {
  bundles: ParsedBundle[];
  errors: Array<{ line: string; reason: string }>;
} {
  const bundles: ParsedBundle[] = [];
  const errors: Array<{ line: string; reason: string }> = [];

  // Split by newlines
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    try {
      // Split by common delimiters: space, comma, tab
      const parts = line.split(/[\s,\t]+/).filter((p) => p.length > 0);

      if (parts.length < 2) {
        errors.push({
          line,
          reason: "Invalid format - needs phone number and gig amount",
        });
        continue;
      }

      // Try to find phone number and gig amount
      let phoneNumber: string | null = null;
      let gigAmount: number | null = null;

      // Try each part as phone number
      for (const part of parts) {
        const extracted = extractPhoneNumber(part);
        if (extracted) {
          phoneNumber = extracted;
          break;
        }
      }

      if (!phoneNumber) {
        errors.push({
          line,
          reason: "No valid 10-digit phone number found",
        });
        continue;
      }

      // Try to find gig amount (preferentially from last parts)
      for (let i = parts.length - 1; i >= 0; i--) {
        const normalized = normalizeGigAmount(parts[i]);
        if (normalized !== null) {
          gigAmount = normalized;
          break;
        }
      }

      if (gigAmount === null) {
        errors.push({
          line,
          reason: "No valid gig amount found",
        });
        continue;
      }

      bundles.push({
        phoneNumber,
        gigAmount,
        rawLine: line,
      });
    } catch (error) {
      errors.push({
        line,
        reason: "Parse error: " + (error instanceof Error ? error.message : "Unknown error"),
      });
    }
  }

  return { bundles, errors };
}

/**
 * Validates a phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

/**
 * Validates a gig amount
 */
export function isValidGigAmount(amount: number): boolean {
  return amount > 0 && amount <= 1000; // Reasonable upper limit
}
