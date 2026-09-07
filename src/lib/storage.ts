export interface ReconciliationRecord {
  id: string;
  createdAt: string;
  openingCash: number;
  expectedCash: number;
  countedCash: number;
  theoreticalTotal: number;
  difference: number;
  status: "balanced" | "shortage" | "surplus";
  currency: string;
  note?: string;
}

export interface AppSettings {
  theme: "light" | "dark";
  language: "en" | "ar";
  currency: "MAD" | "EUR" | "USD" | "GBP";
}

const RECORDS_KEY = "cash_records";
const SETTINGS_KEY = "app_settings";

const defaultSettings: AppSettings = {
  theme: "light",
  language: "en",
  currency: "MAD",
};

export const getRecords = (): ReconciliationRecord[] => {
  try {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse records", e);
    return [];
  }
};

export const saveRecord = (record: ReconciliationRecord): void => {
  const records = getRecords();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const deleteRecord = (id: string): void => {
  const records = getRecords().filter((r) => r.id !== id);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const clearAllRecords = (): void => {
  localStorage.removeItem(RECORDS_KEY);
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  } catch (e) {
    console.error("Failed to parse settings", e);
    return defaultSettings;
  }
};

export const saveSettings = (s: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
};
