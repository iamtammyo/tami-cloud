import { z } from "zod";
import { DEAL_STATUSES } from "./types";

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\//.test(v), "Must start with http:// or https://")
  .transform((v) => (v === "" ? null : v));

export const profileSchema = z.object({
  business_name: z.string().min(1, "Required"),
  display_name: z.string().min(1, "Required"),
  address_lines: z.array(z.string()),
  email: z.string().email("Enter a valid email"),
  default_net_days: z.coerce.number().int().min(0).max(365),
  default_currency: z.string().min(1).max(6),
  memo_convention: z.string(),
  next_invoice_number: z.coerce.number().int().min(1),
});

export const paymentMethodSchema = z.object({
  type: z.enum(["bank", "wise", "paypal", "payoneer", "other"]),
  label: z.string().min(1, "Required"),
  details: z.record(z.string()),
  is_default: z.boolean(),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  role: z.string(),
});

export const brandSchema = z.object({
  name: z.string().min(1, "Required"),
  bill_to_name: z.string().min(1, "Required"),
  address_lines: z.array(z.string()),
  notes: z.string(),
  default_rate: z
    .union([z.coerce.number().nonnegative(), z.literal("").transform(() => null)])
    .nullable(),
  contacts: z.array(contactSchema),
});

export const deliverableSchema = z.object({
  description: z.string().min(1, "Required"),
  due_date: z.string().nullable(),
  post_url: optionalUrl,
  amount: z.coerce.number().nonnegative(),
  delivered_at: z.string().nullable(),
});

export const dealSchema = z.object({
  brand_id: z.string().min(1, "Pick a brand"),
  campaign_name: z.string().min(1, "Required"),
  status: z.enum(DEAL_STATUSES as [string, ...string[]]),
  total_value: z.coerce.number().nonnegative(),
  currency: z.string().min(1).max(6),
  usage_rights_months: z
    .union([z.coerce.number().int().nonnegative(), z.literal("").transform(() => null)])
    .nullable(),
  usage_rights_start: z.string().nullable(),
  exclusivity_notes: z.string(),
});

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Required"),
  detail: z.string(),
  link: optionalUrl,
  amount: z.coerce.number().nonnegative(),
});

export const invoiceSchema = z.object({
  brand_id: z.string().min(1, "Pick a brand"),
  number: z.string().min(1, "Required"),
  date: z.string().min(1, "Required"),
  net_days: z.coerce.number().int().min(0).max(365),
  memo: z.string(),
  campaign: z.string(),
  currency: z.string().min(1).max(6),
  payment_method_id: z.string().nullable(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type DealInput = z.infer<typeof dealSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
