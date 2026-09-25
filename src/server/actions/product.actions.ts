'use server';
import { db } from '@/db';
import { products, categories, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { UpdatePriceSchema, ToggleAvailabilitySchema, UpdateProductSchema } from '@/lib/validators';
import { randomUUID } from 'crypto';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function requireManager(role: string | undefined): ActionResult<never> | null {
  if (role !== 'manager') {
    return { success: false, error: 'غير مصرح: هذا الإجراء للمدير فقط' };
  }
  return null;
}

export async function getProducts(includeDeleted: boolean = false): Promise<ActionResult<any[]>> {
  try {
    // The active menu and recycle bin must remain separate.
    const rows = db.select().from(products)
      .where(eq(products.isDeleted, includeDeleted))
      .all();
    return { success: true, data: rows };
  } catch (e) {
    return { success: false, error: 'فشل في جلب المنتجات' };
  }
}

export async function getCategories(): Promise<ActionResult<any[]>> {
  try {
    const rows = db.select().from(categories).all();
    return { success: true, data: rows };
  } catch (e) {
    return { success: false, error: 'فشل في جلب التصنيفات' };
  }
}

export async function createCategory(input: unknown): Promise<ActionResult<any>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  const name = typeof input === 'object' && input !== null && 'name' in input
    ? String((input as { name: unknown }).name).trim()
    : '';
  if (name.length < 2 || name.length > 50) {
    return { success: false, error: 'اسم الفئة يجب أن يكون بين حرفين و50 حرفاً' };
  }

  try {
    const category = { id: randomUUID(), name, createdAt: new Date() };
    db.insert(categories).values(category).run();
    return { success: true, data: category };
  } catch (error) {
    return { success: false, error: 'تعذر إضافة الفئة. قد يكون الاسم مستخدماً بالفعل.' };
  }
}

export async function deleteCategory(input: unknown): Promise<ActionResult<boolean>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  const id = typeof input === 'object' && input !== null && 'id' in input
    ? String((input as { id: unknown }).id)
    : '';
  if (!id) return { success: false, error: 'معرّف الفئة مطلوب' };

  const linkedProducts = db.select({ id: products.id }).from(products)
    .where(eq(products.categoryId, id))
    .all();
  if (linkedProducts.length > 0) {
    return { success: false, error: 'لا يمكن حذف فئة تحتوي على منتجات. انقل أو احذف منتجاتها أولاً.' };
  }

  try {
    db.delete(categories).where(eq(categories.id, id)).run();
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error: 'تعذر حذف الفئة' };
  }
}

export async function createProduct(input: unknown): Promise<ActionResult<any>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  // Simplified validation for current schema
  const parsed = input as { categoryId: string; name: string; price: number; isAvailable?: boolean; imageUrl?: string };
  if (!parsed.categoryId || !parsed.name || !parsed.price) {
    return { success: false, error: 'بيانات غير صالحة' };
  }

  const now = new Date();
  const id  = randomUUID();
  try {
    db.insert(products).values({ 
      id, 
      categoryId: parsed.categoryId, 
      name: parsed.name, 
      price: parsed.price, 
      isAvailable: parsed.isAvailable ?? true,
      imageUrl: parsed.imageUrl || null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    }).run();
    const [row] = db.select().from(products).where(eq(products.id, id)).all();
    return { success: true, data: row };
  } catch (e) {
    console.error('Create product error:', e);
    return { success: false, error: 'فشل في إنشاء المنتج: ' + (e as Error).message };
  }
}

export async function updateProductPrice(input: unknown): Promise<ActionResult<boolean>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  const parsed = UpdatePriceSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    db.update(products)
      .set({ price: parsed.data.price })
      .where(eq(products.id, parsed.data.id))
      .run();
    return { success: true, data: true };
  } catch (e) {
    return { success: false, error: 'فشل في تحديث السعر' };
  }
}

export async function toggleProductAvailability(input: unknown): Promise<ActionResult<boolean>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  const parsed = ToggleAvailabilitySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    db.update(products)
      .set({ isAvailable: parsed.data.isAvailable })
      .where(eq(products.id, parsed.data.id))
      .run();
    return { success: true, data: true };
  } catch (e) {
    return { success: false, error: 'فشل في تغيير توفر الصنف' };
  }
}

export async function updateProduct(input: unknown): Promise<ActionResult<any>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  const parsed = UpdateProductSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  try {
    const { id, ...updateData } = parsed.data;
    const now = new Date();
    db.update(products)
      .set({ ...updateData, updatedAt: now })
      .where(eq(products.id, id))
      .run();
    const [row] = db.select().from(products).where(eq(products.id, id)).all();
    return { success: true, data: row };
  } catch (e) {
    return { success: false, error: 'فشل في تحديث المنتج' };
  }
}

export async function deleteProduct(input: unknown): Promise<ActionResult<boolean>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  const parsed = input as { id: string };
  if (!parsed.id) {
    return { success: false, error: 'معرف المنتج مطلوب' };
  }

  try {
    // Soft delete - just mark as deleted
    db.update(products)
      .set({ isDeleted: true })
      .where(eq(products.id, parsed.id))
      .run();
    return { success: true, data: true };
  } catch (e) {
    return { success: false, error: 'فشل في حذف المنتج' };
  }
}

export async function restoreProduct(input: unknown): Promise<ActionResult<boolean>> {
  const session = await auth();
  const authError = requireManager((session?.user as any)?.role);
  if (authError) return authError;

  const parsed = input as { id: string };
  if (!parsed.id) {
    return { success: false, error: 'معرف المنتج مطلوب' };
  }

  try {
    db.update(products)
      .set({ isDeleted: false })
      .where(eq(products.id, parsed.id))
      .run();
    return { success: true, data: true };
  } catch (e) {
    return { success: false, error: 'فشل في استعادة المنتج' };
  }
}
