export type Currency = 'NGN' | 'USD';
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'gmail' | 'bank_api';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  amount: number;
  currency: Currency;
  description: string;
  category_id?: number;
  transaction_date: string;
  transaction_type: TransactionType;
  source?: TransactionSource;
  source_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  tags?: Tag[];
}

export interface Budget {
  id: number;
  name: string;
  amount: number;
  currency: Currency;
  period: BudgetPeriod;
  category_id?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  date: string;
  created_at: string;
}

export interface CreateTransactionInput {
  amount: number;
  currency: Currency;
  description: string;
  category_id?: number;
  transaction_date: string;
  transaction_type: TransactionType;
  source?: TransactionSource;
  source_id?: string;
  notes?: string;
  tag_ids?: number[];
}

export interface UpdateTransactionInput {
  amount?: number;
  currency?: Currency;
  description?: string;
  category_id?: number;
  transaction_date?: string;
  transaction_type?: TransactionType;
  notes?: string;
  tag_ids?: number[];
}

export interface CreateBudgetInput {
  name: string;
  amount: number;
  currency: Currency;
  period: BudgetPeriod;
  category_id?: number;
  start_date: string;
  end_date?: string;
}

export interface SpendingSummary {
  total_income: number;
  total_expenses: number;
  net: number;
  currency: Currency;
  by_category: {
    category_name: string;
    total: number;
  }[];
}
