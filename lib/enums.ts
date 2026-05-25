export const UserRole = {
  USER: "USER",
  SUPPORT: "SUPPORT",
  DEVELOPER: "DEVELOPER",
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN_GLOBAL: "ADMIN_GLOBAL",
  OWNER: "OWNER"
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const StoreRole = {
  STORE_OWNER: "STORE_OWNER",
  STORE_ADMIN: "STORE_ADMIN",
  STORE_MANAGER: "STORE_MANAGER",
  STORE_STAFF: "STORE_STAFF",
  VIEWER: "VIEWER",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF"
} as const;
export type StoreRole = (typeof StoreRole)[keyof typeof StoreRole];

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
  BUSINESS: "BUSINESS",
  ENTERPRISE: "ENTERPRISE"
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
