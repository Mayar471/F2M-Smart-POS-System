'use server';
import { db } from '@/db';
import { users, products, orders, orderItems } from '@/db/schema';
import { eq, and, gte, lt, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import bcrypt from 'bcrypt';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function changePassword(input: unknown): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'يجب تسجيل الدخول' };
  }

  const parsed = input as { oldPassword: string; newPassword: string };
  
  if (!parsed.oldPassword || !parsed.newPassword) {
    return { success: false, error: 'جميع الحقول مطلوبة' };
  }

  if (parsed.newPassword.length < 6) {
    return { success: false, error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' };
  }

  const userId = (session.user as any).userId;
  
  try {
    const [user] = db.select().from(users)
      .where(eq(users.id, userId))
      .all();

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    const passwordMatch = await bcrypt.compare(parsed.oldPassword, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'كلمة المرور القديمة غير صحيحة' };
    }

    const newPasswordHash = await bcrypt.hash(parsed.newPassword, 10);

    db.update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId))
      .run();

    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: 'فشل في تغيير كلمة المرور' };
  }
}

export async function getDashboardStats(): Promise<ActionResult<{ todayRevenue: number; completedOrders: number; activeProducts: number }>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    // Get active products count (available AND not deleted)
    const activeProducts = db.select().from(products)
      .where(and(
        eq(products.isAvailable, true),
        eq(products.isDeleted, false)
      ))
      .all();

    return {
      success: true,
      data: {
        todayRevenue: 0,
        completedOrders: 0,
        activeProducts: activeProducts.length
      }
    };
  } catch (e) {
    return { success: false, error: 'فشل في جلب الإحصائيات' };
  }
}

export async function getYesterdayStats(): Promise<ActionResult<{ yesterdayRevenue: number; yesterdayCompletedOrders: number }>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Get yesterday's completed orders
    const yesterdayOrders = db.select().from(orders)
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, yesterday),
        lt(orders.createdAt, startOfToday)
      ))
      .all();

    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      success: true,
      data: {
        yesterdayRevenue,
        yesterdayCompletedOrders: yesterdayOrders.length
      }
    };
  } catch (e) {
    return { success: false, error: 'فشل في جلب إحصائيات الأمس' };
  }
}

export async function getRecentOrders(): Promise<ActionResult<Array<{ id: string; customerName: string | null; totalAmount: number; status: string }>>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    const recentOrders = db.select({
      id: orders.id,
      customerName: orders.customerName,
      totalAmount: orders.totalAmount,
      status: orders.status
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5)
    .all();

    return { success: true, data: recentOrders };
  } catch (e) {
    return { success: false, error: 'فشل في جلب الطلبات الأخيرة' };
  }
}

export async function getAlerts(): Promise<ActionResult<{ disabledProducts: number; cancelledOrdersToday: number }>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    // Get disabled products count
    const disabledProducts = db.select().from(products)
      .where(eq(products.isAvailable, false))
      .all();

    // Get today's cancelled orders count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfDay);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const cancelledOrders = db.select().from(orders)
      .where(and(
        eq(orders.status, 'cancelled'),
        gte(orders.createdAt, startOfDay),
        lt(orders.createdAt, startOfTomorrow)
      ))
      .all();

    return {
      success: true,
      data: {
        disabledProducts: disabledProducts.length,
        cancelledOrdersToday: cancelledOrders.length
      }
    };
  } catch (e) {
    return { success: false, error: 'فشل في جلب التنبيهات' };
  }
}

export async function getAverageOrdersForDay(): Promise<ActionResult<number>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Get date 28 days ago
    const twentyEightDaysAgo = new Date(today);
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    twentyEightDaysAgo.setHours(0, 0, 0, 0);

    // Get all completed orders from past 28 days
    const pastOrders = db.select().from(orders)
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, twentyEightDaysAgo)
      ))
      .all();

    // Filter orders that occurred on the same day of week as today
    const sameDayOrders = pastOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getDay() === todayDayOfWeek;
    });

    // Calculate average (divide by 4 weeks)
    const average = Math.round(sameDayOrders.length / 4);

    return { success: true, data: average };
  } catch (e) {
    return { success: false, error: 'فشل في جلب متوسط الطلبات' };
  }
}

export async function clearProductRecords(password: string): Promise<ActionResult<void>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    const userId = (session.user as any).userId;
    
    // Verify password
    const [user] = db.select().from(users)
      .where(eq(users.id, userId))
      .all();

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    // Clear product records (delete all products)
    db.delete(products).run();

    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: 'فشل في مسح سجلات المنتجات' };
  }
}

export async function clearSalesRecords(password: string): Promise<ActionResult<void>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح' };
  }

  try {
    const userId = (session.user as any).userId;
    
    // Verify password
    const [user] = db.select().from(users)
      .where(eq(users.id, userId))
      .all();

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    // Clear sales records (delete all orders and order items)
    db.delete(orderItems).run();
    db.delete(orders).run();

    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: 'فشل في مسح سجلات المبيعات' };
  }
}
