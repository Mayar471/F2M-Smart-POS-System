import { text, integer, sqliteTable, real } from 'drizzle-orm/sqlite-core';

import { relations } from 'drizzle-orm';



// 1. Users Table

export const users = sqliteTable('users', {

  id: text('id').primaryKey(),

  name: text('name').notNull(),

  username: text('username').notNull().unique(),

  passwordHash: text('password_hash').notNull(),

  role: text('role', { enum: ['cashier', 'manager'] }).notNull().default('cashier'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

});



// 2. Categories Table

export const categories = sqliteTable('categories', {

  id: text('id').primaryKey(),

  name: text('name').notNull().unique(),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

});



// 3. Products Table

export const products = sqliteTable('products', {

  id: text('id').primaryKey(),

  name: text('name').notNull(),

  categoryId: text('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),

  price: real('price').notNull(), // السعر الأساسي يُقرأ ويُثبت من قاعدة البيانات لحماية النظام

  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),

  imageUrl: text('image_url'),

  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),

});



// 4. Orders Table

export const orders = sqliteTable('orders', {

  id: text('id').primaryKey(),

  userId: text('user_id').references(() => users.id).notNull(),

  totalAmount: real('total_amount').notNull(),

  status: text('status', { enum: ['pending', 'completed', 'cancelled'] }).notNull().default('pending'),

  channel: text('channel', { enum: ['dine_in', 'walk_in', 'drive_thru', 'delivery'] }).notNull().default('dine_in'),

  notes: text('notes'),

  cancellationReason: text('cancellation_reason'), // Non-negotiable: يجب ملؤه في حال الإلغاء

  customerName: text('customer_name'), // اسم العميل

  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

});



// 5. Order Items Table (Many-to-Many Bridge)

export const orderItems = sqliteTable('order_items', {

  id: text('id').primaryKey(),

  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),

  productId: text('product_id').references(() => products.id).notNull(),

  quantity: integer('quantity').notNull(),

  unitPrice: real('unit_price').notNull(), // لتثبيت السعر وقت البيع حتى لو تغير سعر المنتج لاحقاً

  totalPrice: real('total_price').notNull(),

});



// 6. Sync Log Table

export const syncLog = sqliteTable('sync_log', {

  id: text('id').primaryKey(),

  actionType: text('action_type').notNull(), // 'INSERT', 'UPDATE'

  tableName: text('table_name').notNull(),

  recordId: text('record_id').notNull(),

  payload: text('payload').notNull(), // البيانات بصيغة JSON المُراد رفعها للسحاب

  status: text('status', { enum: ['pending', 'synced', 'failed'] }).notNull().default('pending'),

  errorMessage: text('error_message'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

});



// ===================================================

// العلاقات المتبادلة (Relations) لتسهيل الـ Queries

// ===================================================



export const ordersRelations = relations(orders, ({ one, many }) => ({

  user: one(users, { fields: [orders.userId], references: [users.id] }),

  items: many(orderItems),

}));



export const orderItemsRelations = relations(orderItems, ({ one }) => ({

  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),

  product: one(products, { fields: [orderItems.productId], references: [products.id] }),

}));



export const productsRelations = relations(products, ({ one }) => ({

  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),

}));



// 7. Shift Sessions Table

export const shiftSessions = sqliteTable('shift_sessions', {
  id: text('id').primaryKey(),
  startedAt: text('started_at').notNull(),
  stoppedAt: text('stopped_at'),
  startedBy: text('started_by').references(() => users.id).notNull(),
});