/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Drink', icon: 'Utensils', color: '#f87171' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: '#60a5fa' },
  { id: 'rent', name: 'Rent & Housing', icon: 'Home', color: '#fbbf24' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Gamepad2', color: '#a78bfa' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#f472b6' },
  { id: 'health', name: 'Health', icon: 'HeartPulse', color: '#34d399' },
  { id: 'utilities', name: 'Utilities', icon: 'Zap', color: '#fb923c' },
  { id: 'income', name: 'Income', icon: 'Wallet', color: '#10b981' },
  { id: 'other', name: 'Other', icon: 'CircleEllipsis', color: '#94a3b8' },
];

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
];
