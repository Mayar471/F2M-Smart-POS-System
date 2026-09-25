'use server';
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { eq, gte, lte, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function getPeriodDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let start: Date;
  switch (period) {
    case 'daily':   start = new Date(now.setHours(0, 0, 0, 0)); break;
    case 'weekly':  start = new Date(now.setDate(now.getDate() - 7)); break;
    case 'monthly': start = new Date(now.setMonth(now.getMonth() - 1)); break;
    case 'yearly':  start = new Date(now.setFullYear(now.getFullYear() - 1)); break;
    default:        start = new Date(now.setHours(0, 0, 0, 0));
  }
  return { startDate: start, endDate: new Date() };
}

export async function getReportSummary(input: unknown): Promise<ActionResult<any>> {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return { success: false, error: 'غير مصرح: التقارير للمدير فقط' };
  }

  const parsed = input as { period?: string; startDate?: string; endDate?: string };
  const period = parsed.period || 'daily';
  const { startDate, endDate } = parsed.startDate && parsed.endDate
    ? { startDate: new Date(parsed.startDate), endDate: new Date(parsed.endDate) }
    : getPeriodDateRange(period);

  try {
    // All orders in period
    const periodOrders = db.select().from(orders)
      .where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      ))
      .all();

    const completedOrders  = periodOrders.filter(o => o.status === 'completed');
    const cancelledOrders  = periodOrders.filter(o => o.status === 'cancelled');
    const totalRevenue     = completedOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);

    // Top products — simple aggregation using productId
    const soldItems = db.select({
      productId: orderItems.productId,
      productName: products.name,
      quantity: orderItems.quantity,
      totalPrice: orderItems.totalPrice,
    })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      ))
      .all();
    const productMap = new Map<string, { productName: string; quantity: number; revenue: number }>();

    for (const item of soldItems) {
      const current = productMap.get(item.productId) || {
        productName: item.productName || 'منتج محذوف',
        quantity: 0,
        revenue: 0,
      };
      productMap.set(item.productId, {
        productName: current.productName,
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + Number(item.totalPrice),
      });
    }

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      success: true,
      data: {
        period, 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        totalRevenue,
        totalOrders:     periodOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        pendingOrders: periodOrders.filter(o => o.status === 'pending').length,
        averageOrderValue: completedOrders.length ? totalRevenue / completedOrders.length : 0,
        topProducts,
      },
    };
  } catch (e) {
    return { success: false, error: 'فشل في توليد التقرير' };
  }
}
