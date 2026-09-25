'use server';
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { randomUUID } from 'crypto';
import { createSyncLogEntry } from '@/server/sync/sync.worker';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createOrder(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const session = await auth();
  // Allow public access for POS - use default cashier ID if not authenticated
  const cashierId = (session?.user as any)?.userId || 'usr_cashier_01';

  const parsed = input as { orderNumber?: string; channel: string; items: Array<{ productId: string; quantity: number; unitPrice: number }>; customerName: string; cashReceived?: number; notes?: string };
  console.log('createOrder - parsed input:', parsed);
  
  if (!parsed.channel || !parsed.items || parsed.items.length === 0 || !parsed.customerName || !/^\d{13,}$/.test(parsed.orderNumber || '')) {
    console.log('createOrder - validation failed');
    return { success: false, error: 'بيانات غير صالحة' };
  }

  const { channel, items, customerName, cashReceived, notes } = parsed;
  const now = new Date();
  let orderId = parsed.orderNumber!;
  console.log('createOrder - initial orderId:', orderId);

  // Check if order ID already exists (conflict from multiple devices)
  const existingOrder = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (existingOrder) {
    // Generate a new unique order ID by adding a random suffix
    orderId = `${orderId}-${Math.floor(Math.random() * 10000)}`;
    console.log('createOrder - orderId conflict, new orderId:', orderId);
  }

  // Snapshot prices from DB — never trust client-sent prices for totals
  const productIds = items.map(i => i.productId);
  console.log('createOrder - productIds:', productIds);
  
  // Check if we have multiple products - need proper WHERE clause
  let dbProducts;
  if (productIds.length === 1) {
    dbProducts = db.select().from(products)
      .where(eq(products.id, productIds[0]))
      .all();
  } else {
    // For multiple products, we need to use IN clause or multiple queries
    // Since Drizzle doesn't support IN easily with SQLite, fetch all and filter
    const allProducts = db.select().from(products).all();
    dbProducts = allProducts.filter(p => productIds.includes(p.id));
  }
  
  console.log('createOrder - dbProducts found:', dbProducts.length);
  console.log('createOrder - dbProducts IDs:', dbProducts.map(p => p.id));

  // Build a price map from DB
  const priceMap = new Map(dbProducts.map(p => [p.id, { price: p.price, name: p.name }]));

  // Validate all products exist and are available
  for (const item of items) {
    const dbProduct = priceMap.get(item.productId);
    if (!dbProduct) {
      console.log('createOrder - product not found:', item.productId);
      return { success: false, error: `منتج غير موجود: ${item.productId}` };
    }
  }

  // Calculate totals using DB prices (authoritative)
  const orderItemRows = items.map(item => {
    const dbProduct = priceMap.get(item.productId)!;
    return {
      id:          randomUUID(),
      orderId,
      productId:   item.productId,
      productName: dbProduct.name,
      quantity:    item.quantity,
      unitPrice:   dbProduct.price,
      totalPrice:  dbProduct.price * item.quantity,
    };
  });

  const subtotal    = orderItemRows.reduce((acc, i) => acc + i.totalPrice, 0);
  const changeAmount = cashReceived ? Math.max(0, cashReceived - subtotal) : undefined;
  console.log('createOrder - subtotal:', subtotal, 'items count:', orderItemRows.length);

  // Insert order and items with retry logic for ID conflicts
  try {
    let orderInserted = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!orderInserted && retryCount < maxRetries) {
      try {
        db.insert(orders).values({
          id: orderId, 
          userId: cashierId, 
          totalAmount: subtotal,
          status: 'pending' as const,
          channel: channel as any,
          notes: notes || null,
          cancellationReason: null,
          customerName: customerName,
          isSynced: false,
          createdAt: now,
        }).run();
        console.log('createOrder - order inserted successfully');
        orderInserted = true;
      } catch (insertError: any) {
        retryCount++;
        console.error(`createOrder - insert attempt ${retryCount} failed:`, insertError.message);
        
        if (retryCount < maxRetries) {
          // Generate new order ID and retry
          orderId = `${parsed.orderNumber!}-${Math.floor(Math.random() * 10000)}-${retryCount}`;
          console.log(`createOrder - retrying with new orderId: ${orderId}`);
          // Update orderItemRows with new orderId
          orderItemRows.forEach(item => item.orderId = orderId);
        } else {
          throw insertError;
        }
      }
    }

    if (!orderInserted) {
      return { success: false, error: 'فشل في إنشاء الطلب بعد عدة محاولات' };
    }

    for (const item of orderItemRows) {
      try {
        db.insert(orderItems).values({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }).run();
      } catch (itemError: any) {
        console.error('createOrder - failed to insert order item:', itemError.message);
        console.error('createOrder - item details:', item);
        throw itemError;
      }
    }
    console.log('createOrder - order items inserted successfully');

    // Create sync log entry for cloud sync (non-critical)
    try {
      await createSyncLogEntry('orders', orderId, {
        id: orderId,
        userId: cashierId,
        totalAmount: subtotal,
        status: 'pending',
        items: orderItemRows,
        channel,
        notes,
        createdAt: now.toISOString(),
      });
      console.log('createOrder - sync log entry created');
    } catch (syncError) {
      console.error('createOrder - sync log error (non-critical):', syncError);
      // Continue even if sync log fails
    }

    console.log('createOrder - returning success');
    return { success: true, data: { orderId } };
  } catch (e) {
    console.error('createOrder - error:', e);
    return { success: false, error: 'فشل في إنشاء الطلب: ' + (e as Error).message };
  }
}

export async function updateOrderStatus(input: unknown): Promise<ActionResult<boolean>> {
  const session = await auth();
  // Allow public access for POS
  const userId = (session?.user as any)?.userId || 'public-pos';
  const role = (session?.user as any)?.role || 'cashier';

  const parsed = input as { orderId: string; status: string; cancellationReason?: string };
  if (!parsed.orderId || !parsed.status) {
    return { success: false, error: 'بيانات غير صالحة' };
  }

  const { orderId, status, cancellationReason } = parsed;

  const [order] = db.select().from(orders).where(eq(orders.id, orderId)).all();
  if (!order) return { success: false, error: 'الطلب غير موجود' };

  // Public POS can update any order
  try {
    db.update(orders)
      .set({
        status: status as 'pending' | 'completed' | 'cancelled',
        cancellationReason: cancellationReason ?? null,
      })
      .where(eq(orders.id, orderId))
      .run();
    return { success: true, data: true };
  } catch (e) {
    return { success: false, error: 'فشل في تحديث حالة الطلب' };
  }
}

export async function getActiveOrders(): Promise<ActionResult<any[]>> {
  // Allow public access for POS
  try {
    const rows = db.select().from(orders)
      .where(eq(orders.status, 'pending'))
      .all();
    return { success: true, data: rows };
  } catch (e) {
    return { success: false, error: 'فشل في جلب الطلبات' };
  }
}

export async function getTodayCompletedOrdersCount(): Promise<ActionResult<number>> {
  // Allow public access for POS
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  try {
    const completedOrders = db.select({ id: orders.id }).from(orders)
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, startOfDay),
        lt(orders.createdAt, startOfTomorrow),
      ))
      .all();
    return { success: true, data: completedOrders.length };
  } catch (error) {
    return { success: false, error: 'تعذر حساب طلبات اليوم' };
  }
}

export async function getOrderDetails(orderId: string): Promise<ActionResult<{
  order: any;
  items: Array<{ product: any; quantity: number; unitPrice: number }>;
}>> {
  // Allow public access for POS
  try {
    const [order] = db.select().from(orders).where(eq(orders.id, orderId)).all();
    if (!order) return { success: false, error: 'الطلب غير موجود' };

    // Fetch items with product info
    const itemsRows = db.select({
      orderItemId: orderItems.id,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      productName: products.name,
      categoryId: products.categoryId,
      isAvailable: products.isAvailable,
      price: products.price,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId))
    .all();

    const items = itemsRows.map(row => ({
      product: {
        id: row.productId,
        name: row.productName || 'منتج غير معروف',
        categoryId: row.categoryId || '',
        price: row.price ?? row.unitPrice,
        isAvailable: row.isAvailable ?? true,
        createdAt: '',
        updatedAt: '',
      },
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    }));

    return { success: true, data: { order, items } };
  } catch (e) {
    return { success: false, error: 'فشل في جلب تفاصيل الطلب' };
  }
}

export async function updateOrder(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const session = await auth();
  // Allow public access for POS - use default cashier ID if not authenticated
  const cashierId = (session?.user as any)?.userId || 'usr_cashier_01';
  const role = (session?.user as any)?.role || 'cashier';

  const parsed = input as { orderId: string; channel: string; items: Array<{ productId: string; quantity: number; unitPrice: number }>; customerName: string; notes?: string };
  if (!parsed.orderId || !parsed.channel || !parsed.items || parsed.items.length === 0 || !parsed.customerName) {
    return { success: false, error: 'بيانات غير صالحة' };
  }

  const { orderId, channel, items, customerName, notes } = parsed;

  const [existingOrder] = db.select().from(orders).where(eq(orders.id, orderId)).all();
  if (!existingOrder) return { success: false, error: 'الطلب غير موجود' };

  // Cashiers can only update their own orders (if authenticated)
  if (session && role === 'cashier' && existingOrder.userId !== cashierId) {
    return { success: false, error: 'غير مصرح بتعديل طلبات الآخرين' };
  }

  // Snapshot prices from DB
  const productIds = items.map(i => i.productId);
  const dbProducts = db.select().from(products)
    .where(productIds.length === 1
      ? eq(products.id, productIds[0])
      : undefined)
    .all();

  const priceMap = new Map(dbProducts.map(p => [p.id, { price: p.price, name: p.name }]));

  // Validate all products exist
  for (const item of items) {
    const dbProduct = priceMap.get(item.productId);
    if (!dbProduct) return { success: false, error: `منتج غير موجود: ${item.productId}` };
  }

  // Calculate totals using DB prices
  const orderItemRows = items.map(item => {
    const dbProduct = priceMap.get(item.productId)!;
    return {
      id:          randomUUID(),
      orderId,
      productId:   item.productId,
      productName: dbProduct.name,
      quantity:    item.quantity,
      unitPrice:   dbProduct.price,
      totalPrice:  dbProduct.price * item.quantity,
    };
  });

  const subtotal = orderItemRows.reduce((acc, i) => acc + i.totalPrice, 0);

  try {
    // 1. Update order row
    db.update(orders).set({
      totalAmount: subtotal,
      customerName: customerName,
      channel: channel as any,
      notes: notes || null,
      isSynced: false,
    })
    .where(eq(orders.id, orderId))
    .run();

    // 2. Delete old order items
    db.delete(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .run();

    // 3. Insert new order items
    for (const item of orderItemRows) {
      db.insert(orderItems).values({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }).run();
    }

    // 4. Create sync log entry for cloud sync (actionType UPDATE)
    await createSyncLogEntry('orders', orderId, {
      id: orderId,
      userId: existingOrder.userId,
      totalAmount: subtotal,
      status: existingOrder.status,
      items: orderItemRows,
      channel,
      notes,
      createdAt: new Date(existingOrder.createdAt).toISOString(),
    });

    return { success: true, data: { orderId } };
  } catch (e) {
    return { success: false, error: 'فشل في تحديث الطلب' };
  }
}
