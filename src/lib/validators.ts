// src/lib/validators.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(6, 'كلمة المرور 6 أحرف على الأقل'),
});

export const CreateProductSchema = z.object({
  categoryId:  z.string().min(1, 'معرّف التصنيف مطلوب'),
  name:        z.string().min(2).max(100),
  price:       z.number().positive('السعر يجب أن يكون موجباً'),
  isAvailable: z.boolean().default(true),
  imageUrl:    z.string().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().min(1, 'معرّف المنتج مطلوب'),
});

export const UpdatePriceSchema = z.object({
  id:    z.string().min(1, 'معرّف المنتج مطلوب'),
  price: z.number().positive(),
});

export const ToggleAvailabilitySchema = z.object({
  id:          z.string().min(1, 'معرّف المنتج مطلوب'),
  isAvailable: z.boolean(),
});

export const CreateOrderSchema = z.object({
  channel: z.enum(['drive_thru', 'dine_in', 'delivery']),
  items: z.array(z.object({
    productId:   z.string().uuid(),
    quantity:    z.number().int().positive(),
    unitPrice:   z.number().positive(),
  })).min(1, 'الطلب يجب أن يحتوي على صنف واحد على الأقل'),
  customerName: z.string().min(1, 'اسم العميل مطلوب').max(60, 'اسم العميل طويل جداً'),
  cashReceived: z.number().positive().optional(),
  notes:        z.string().max(500).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderId:            z.string().uuid(),
  status:             z.enum(['processing', 'completed', 'cancelled']),
  cancellationReason: z.string().min(5, 'سبب الإلغاء مطلوب').optional(),
}).refine(
  (data) => data.status !== 'cancelled' || !!data.cancellationReason,
  { message: 'سبب الإلغاء إلزامي عند إلغاء الطلب', path: ['cancellationReason'] }
);

export const CreateUserSchema = z.object({
  name:     z.string().min(2).max(60),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'يسمح فقط بالأحرف الصغيرة والأرقام والشرطة السفلية'),
  password: z.string().min(8),
  role:     z.enum(['cashier', 'manager']),
});

export const ReportQuerySchema = z.object({
  period:    z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().datetime().optional(),
  endDate:   z.string().datetime().optional(),
});

export const UpdateBrandThemeSchema = z.object({
  primaryColor:   z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون hex غير صالح'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor:    z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textOnPrimary:  z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logoUrl:        z.string().url().or(z.literal('')),
});

// Type exports
export type LoginInput              = z.infer<typeof LoginSchema>;
export type CreateProductInput      = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput      = z.infer<typeof UpdateProductSchema>;
export type CreateOrderInput        = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput  = z.infer<typeof UpdateOrderStatusSchema>;
export type CreateUserInput         = z.infer<typeof CreateUserSchema>;
export type ReportQueryInput        = z.infer<typeof ReportQuerySchema>;
export type UpdateBrandThemeInput   = z.infer<typeof UpdateBrandThemeSchema>;
