export const UserRole = {
  USER: "USER",
  PLATFORM_ADMIN: "PLATFORM_ADMIN"
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const CatalogTemplate = {
  MODERN_GRID: "MODERN_GRID",
  BOUTIQUE_PREMIUM: "BOUTIQUE_PREMIUM",
  FAST_SALES: "FAST_SALES",
  TECH_PRO: "TECH_PRO"
} as const;
export type CatalogTemplate = (typeof CatalogTemplate)[keyof typeof CatalogTemplate];

export const PlanType = {
  FREE: "FREE",
  STARTER: "STARTER",
  PRO: "PRO",
  BUSINESS: "BUSINESS"
} as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

export const SubscriptionStatus = {
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  SUSPENDED: "SUSPENDED"
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const ProductStatus = {
  ACTIVE: "ACTIVE",
  DRAFT: "DRAFT",
  ARCHIVED: "ARCHIVED"
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const CustomerStatus = {
  NEW: "NEW",
  INTERESTED: "INTERESTED",
  QUOTE_SENT: "QUOTE_SENT",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  WON: "WON",
  LOST: "LOST",
  FOLLOW_UP: "FOLLOW_UP"
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const ConversationStatus = {
  OPEN: "OPEN",
  WAITING_HUMAN: "WAITING_HUMAN",
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED"
} as const;
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const QuoteStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED"
} as const;
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  PREPARING: "PREPARING",
  READY: "READY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export function enumValues<T extends Record<string, string>>(value: T) {
  return Object.values(value) as [T[keyof T], ...T[keyof T][]];
}
