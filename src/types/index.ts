// src/types/index.ts
// Single source of truth for all shared TypeScript interfaces and enums

export type UserRole = 'cashier' | 'manager';

export type OrderStatus = 'processing' | 'completed' | 'cancelled';

export type OrderChannel = 'drive_thru' | 'dine_in' | 'delivery';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  createdAt: string; // ISO 8601
}

export interface Category {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;        // stored in smallest currency unit (piasters/halala)
  isAvailable: boolean;
  imageUrl?: string;
  isDeleted?: boolean;  // Soft delete flag
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;    // snapshot at time of order
}

export interface Order {
  id: string;
  channel: OrderChannel;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  cashReceived?: number;
  changeAmount?: number;
  notes?: string;
  cancellationReason?: string;
  cashierId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;    // null = not yet synced to cloud
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;  // snapshot
  quantity: number;
  unitPrice: number;    // snapshot
  subtotal: number;
}

export interface BrandTheme {
  primaryColor: string;    // hex
  secondaryColor: string;  // hex
  accentColor: string;     // hex
  textOnPrimary: string;   // hex (contrast-safe)
  logoUrl: string;
}

export interface ReportSummary {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  topProducts: { productName: string; quantity: number; revenue: number }[];
}

// NextAuth type extensions
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { name: string; role: UserRole; userId: string };
  }
  interface JWT {
    role: UserRole;
    userId: string;
  }
}
