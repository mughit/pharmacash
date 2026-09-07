export type VoiceCommand =
  | { type: "navigate"; path: string; label: string }
  | { type: "action"; action: "calculate" | "save" | "reset" }
  | { type: "unknown" };

interface CommandDef {
  keywords: string[];
  command: VoiceCommand;
}

const NAV_COMMANDS: CommandDef[] = [
  {
    keywords: ["الرئيسية", "الاستقبال", "الصفحة الرئيسية", "التسوية الجديدة", "رجع للرئيسية"],
    command: { type: "navigate", path: "/", label: "التسوية" },
  },
  {
    keywords: ["السجل", "التاريخ", "الهيستوري", "افتح السجل"],
    command: { type: "navigate", path: "/history", label: "السجل" },
  },
  {
    keywords: ["لوحة القيادة", "الداشبورد", "لوحة التحكم"],
    command: { type: "navigate", path: "/dashboard", label: "لوحة القيادة" },
  },
  {
    keywords: ["التقرير الشهري", "التقرير", "افتح التقرير"],
    command: { type: "navigate", path: "/report", label: "التقرير" },
  },
  {
    keywords: ["الإعدادات", "الإعداد", "افتح الإعدادات"],
    command: { type: "navigate", path: "/settings", label: "الإعدادات" },
  },
  {
    keywords: ["عن التطبيق", "معلومات عن التطبيق", "حول التطبيق"],
    command: { type: "navigate", path: "/about", label: "عن التطبيق" },
  },
];

const ACTION_COMMANDS: CommandDef[] = [
  {
    keywords: ["احسب وحلل", "احسب النتيجة", "احسب", "حساب", "قارن", "دير الحساب"],
    command: { type: "action", action: "calculate" },
  },
  {
    keywords: ["احفظ السجل", "احفظ", "سجل", "خزن", "دير سيف"],
    command: { type: "action", action: "save" },
  },
  {
    keywords: ["إعادة تعيين", "امسح الكل", "افرغ", "صفر الكل", "مسح"],
    command: { type: "action", action: "reset" },
  },
];

function normalize(text: string): string {
  return text
    .trim()
    .replace(/[\u064B-\u0652]/g, "") // strip Arabic diacritics
    .replace(/\s+/g, " ");
}

export function parseVoiceCommand(rawTranscript: string): VoiceCommand {
  const text = normalize(rawTranscript);
  if (!text) return { type: "unknown" };

  // Actions checked first (more specific, shorter phrases)
  for (const def of ACTION_COMMANDS) {
    if (def.keywords.some((k) => text.includes(k))) {
      return def.command;
    }
  }
  for (const def of NAV_COMMANDS) {
    if (def.keywords.some((k) => text.includes(k))) {
      return def.command;
    }
  }
  return { type: "unknown" };
}
