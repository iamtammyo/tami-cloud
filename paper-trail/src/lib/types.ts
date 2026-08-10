// Core domain types for Paper Trail. Mirrors the Supabase schema in supabase/schema.sql.

export type PaymentMethodType = "bank" | "wise" | "paypal" | "payoneer" | "other";

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  label: string;
  // Free-form key/value details rendered on the invoice (account name, bank, etc.)
  details: Record<string, string>;
  is_default: boolean;
}

export interface Profile {
  business_name: string;
  display_name: string;
  address_lines: string[];
  email: string;
  default_net_days: number;
  default_currency: string;
  memo_convention: string;
  next_invoice_number: number;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Brand {
  id: string;
  name: string;
  bill_to_name: string;
  address_lines: string[];
  notes: string;
  default_rate: number | null;
  contacts: Contact[];
}

export type DealStatus =
  | "Pitched"
  | "Negotiating"
  | "Signed"
  | "In Progress"
  | "Delivered"
  | "Invoiced"
  | "Paid"
  | "Dead";

export const DEAL_STATUSES: DealStatus[] = [
  "Pitched",
  "Negotiating",
  "Signed",
  "In Progress",
  "Delivered",
  "Invoiced",
  "Paid",
  "Dead",
];

export interface Deliverable {
  id: string;
  description: string;
  due_date: string | null;
  post_url: string | null;
  amount: number;
  delivered_at: string | null;
}

export interface PaymentScheduleEntry {
  date: string;
  amount: number;
}

export interface Deal {
  id: string;
  brand_id: string;
  campaign_name: string;
  status: DealStatus;
  total_value: number;
  currency: string;
  contract_file_url: string | null;
  contract_file_name: string | null;
  payment_schedule: PaymentScheduleEntry[];
  usage_rights_months: number | null;
  usage_rights_start: string | null;
  exclusivity_notes: string;
  created_at: string;
  deliverables: Deliverable[];
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid";
// "Overdue" is derived, never stored.
export type DerivedInvoiceStatus = InvoiceStatus | "Overdue";

export interface InvoiceItem {
  id: string;
  description: string;
  detail: string;
  link: string | null;
  amount: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  deal_id: string | null;
  brand_id: string;
  number: string; // zero-padded, e.g. "0003"
  date: string; // ISO date (YYYY-MM-DD)
  net_days: number;
  memo: string;
  campaign: string;
  currency: string;
  status: InvoiceStatus;
  payment_method_id: string | null;
  sent_at: string | null;
  paid_at: string | null;
  items: InvoiceItem[];
}

export interface Database {
  profile: Profile;
  payment_methods: PaymentMethod[];
  brands: Brand[];
  deals: Deal[];
  invoices: Invoice[];
}
