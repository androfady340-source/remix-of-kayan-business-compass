import type { TKey } from "./i18n";

export const MODULE_KEYS = ["clients", "tasks", "invoices", "expenses", "inventory"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const BUSINESS_TYPES = ["services", "shop", "freelancer", "workshop", "other"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Modules pre-selected for each business type during onboarding. */
export const DEFAULT_MODULES: Record<BusinessType, ModuleKey[]> = {
  services: ["clients", "tasks", "invoices", "expenses"],
  shop: ["clients", "invoices", "expenses", "inventory"],
  freelancer: ["clients", "tasks", "invoices"],
  workshop: ["clients", "tasks", "invoices", "expenses", "inventory"],
  other: ["clients", "tasks"],
};

/** Modules that already have a screen; the rest show as "soon". */
export const AVAILABLE_MODULES: ModuleKey[] = [...MODULE_KEYS];

/** Owners/managers edit any task; members only tasks assigned to them. */
export const canEditTask = (r: Role | null, userId: string, assigneeId: string | null) =>
  canEditData(r) || (r === "member" && !!assigneeId && assigneeId === userId);

export const invoiceTotal = (items: { qty: number; price: number }[]) =>
  Math.round(items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0) * 100) / 100;

export const isLowStock = (quantity: number, lowLevel: number) => Number(quantity) <= Number(lowLevel);

export type FieldType = "text" | "number" | "date" | "select";
export type CustomField = { key: string; label_ar: string; label_en: string; type: FieldType; options?: string[] };
export const MAX_CUSTOM_FIELDS = 5;

export type CompanyModule = {
  id: string;
  module_key: ModuleKey;
  enabled: boolean;
  name_ar: string | null;
  name_en: string | null;
  custom_fields: CustomField[];
  sort_order: number;
};

export function moduleLabel(m: Pick<CompanyModule, "module_key" | "name_ar" | "name_en">, lang: "ar" | "en", t: (k: TKey) => string) {
  const custom = lang === "ar" ? m.name_ar : m.name_en;
  return custom?.trim() || t(`mod.${m.module_key}` as TKey);
}

export type Role = "owner" | "manager" | "member";
export const canEditData = (r: Role | null) => r === "owner" || r === "manager";
export const canManageSettings = (r: Role | null) => r === "owner";
