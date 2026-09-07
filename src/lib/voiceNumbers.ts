// Parses a spoken Arabic phrase (Darija or Fusha) into a numeric amount.
// Handles: Arabic-Indic digits, Western digits already transcribed by the
// speech engine, decimal separators ("فاصلة" / "." / ","), and a fallback
// word-number parser for common Darija/Fusha number words.

const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

// Filler / currency words to strip before parsing
const NOISE_WORDS = [
  "درهم", "دراهم", "دولار", "يورو", "ريال", "سنتيم", "سنتيمات",
  "درهما", "المبلغ", "هو", "تقريبا", "تقريباً",
];

// Word → value map (Darija + Fusha variants for common cash amounts)
const UNITS: Record<string, number> = {
  "صفر": 0,
  "واحد": 1, "وحد": 1, "واحدة": 1,
  "اثنين": 2, "اثنان": 2, "جوج": 2,
  "ثلاثة": 3, "تلاتة": 3, "ثلاث": 3,
  "أربعة": 4, "ربعة": 4, "اربعة": 4,
  "خمسة": 5, "خمس": 5,
  "ستة": 6, "سته": 6,
  "سبعة": 7, "سبع": 7,
  "ثمانية": 8, "تمنية": 8, "ثمان": 8,
  "تسعة": 9, "تسع": 9,
  "عشرة": 10, "عشر": 10, "عشرا": 10,
  "أحد عشر": 11, "احداش": 11, "حداش": 11,
  "اثنا عشر": 12, "طناش": 12,
  "ثلاثة عشر": 13, "تلطاش": 13,
  "أربعة عشر": 14, "ربعطاش": 14,
  "خمسة عشر": 15, "خمسطاش": 15,
  "ستة عشر": 16, "سطاش": 16,
  "سبعة عشر": 17, "سبعطاش": 17,
  "ثمانية عشر": 18, "تمنطاش": 18,
  "تسعة عشر": 19, "تسعطاش": 19,
};

const TENS: Record<string, number> = {
  "عشرين": 20,
  "ثلاثين": 30, "تلاتين": 30,
  "أربعين": 40, "ربعين": 40,
  "خمسين": 50,
  "ستين": 60,
  "سبعين": 70,
  "ثمانين": 80, "تمانين": 80,
  "تسعين": 90,
};

const HUNDRED_WORDS = ["مية", "مائة", "ميا"];
const THOUSAND_WORDS = ["ألف", "الف"];
const AND_WORDS = ["و", "وا"];
const DECIMAL_WORDS = ["فاصلة", "فاصل", "نقطة"];

function stripNoise(text: string): string {
  let cleaned = text;
  for (const w of NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(w, "g"), " ");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}

function digitsToWestern(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => ARABIC_INDIC_DIGITS[d] ?? d);
}

function tryParseDigits(text: string): number | null {
  const normalized = digitsToWestern(text);
  // Match things like "1500", "1500.50", "1500,50"
  const match = normalized.match(/(\d+)([.,](\d+))?/);
  if (!match) return null;
  const whole = match[1];
  const frac = match[3];
  const value = frac ? parseFloat(`${whole}.${frac}`) : parseFloat(whole);
  return Number.isNaN(value) ? null : value;
}

function tryParseWords(text: string): number | null {
  let words = text
    .split(/\s+/)
    .filter((w) => !AND_WORDS.includes(w) && w.length > 0);

  if (words.length === 0) return null;

  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const word of words) {
    if (HUNDRED_WORDS.includes(word)) {
      current = (current || 1) * 100;
      total += current;
      current = 0;
      matchedAny = true;
    } else if (THOUSAND_WORDS.includes(word)) {
      current = (current || 1) * 1000;
      total += current;
      current = 0;
      matchedAny = true;
    } else if (word in TENS) {
      current += TENS[word];
      matchedAny = true;
    } else if (word in UNITS) {
      current += UNITS[word];
      matchedAny = true;
    }
    // unrecognized words are silently skipped (e.g. "درهم" leftovers)
  }
  total += current;

  return matchedAny ? total : null;
}

/**
 * Parses a spoken phrase into a numeric cash amount.
 * Returns null if no number could be extracted.
 */
export function parseSpokenAmount(rawTranscript: string): number | null {
  if (!rawTranscript) return null;
  const cleaned = stripNoise(rawTranscript.trim());

  // 1. Prefer digits — most Arabic speech engines already transcribe
  //    spoken numbers as digits (e.g. "خمسمية" -> "500").
  const digitResult = tryParseDigits(cleaned);
  if (digitResult !== null) return digitResult;

  // 2. Handle "X فاصلة Y" style decimals spoken as words
  for (const dw of DECIMAL_WORDS) {
    if (cleaned.includes(dw)) {
      const [wholePart, fracPart] = cleaned.split(dw);
      const whole = tryParseDigits(wholePart) ?? tryParseWords(wholePart) ?? 0;
      const frac = tryParseDigits(fracPart) ?? tryParseWords(fracPart) ?? 0;
      return parseFloat(`${Math.trunc(whole)}.${Math.trunc(frac)}`);
    }
  }

  // 3. Fallback: word-based number parsing
  return tryParseWords(cleaned);
}
