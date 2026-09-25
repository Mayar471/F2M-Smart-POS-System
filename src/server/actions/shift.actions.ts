'use server';
import { db } from '@/db';
import { shiftSessions } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { randomUUID } from 'crypto';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function startShift(): Promise<ActionResult<{ shiftId: string }>> {
  const session = await auth();
  const role = (session?.user as any)?.role;

  // Manager only
  if (role !== 'manager') {
    return { success: false, error: 'غير مصرح: فقط المدير يمكنه بدء الوردية' };
  }

  const userId = (session?.user as any)?.userId;
  if (!userId) {
    return { success: false, error: 'المستخدم غير معروف' };
  }

  // Check if an active shift already exists
  const [activeShift] = db.select().from(shiftSessions)
    .where(isNull(shiftSessions.stoppedAt))
    .all();

  if (activeShift) {
    return { success: false, error: 'توجد وردية نشطة بالفعل' };
  }

  // Insert new shift
  const shiftId = randomUUID();
  const now = new Date().toISOString();

  try {
    db.insert(shiftSessions).values({
      id: shiftId,
      startedAt: now,
      stoppedAt: null,
      startedBy: userId,
    }).run();

    return { success: true, data: { shiftId } };
  } catch (e) {
    console.error('startShift error:', e);
    return { success: false, error: 'فشل في بدء الوردية' };
  }
}

export async function stopShift(): Promise<ActionResult<boolean>> {
  const session = await auth();
  const role = (session?.user as any)?.role;

  // Manager only
  if (role !== 'manager') {
    return { success: false, error: 'غير مصرح: فقط المدير يمكنه إنهاء الوردية' };
  }

  // Find the active shift
  const [activeShift] = db.select().from(shiftSessions)
    .where(isNull(shiftSessions.stoppedAt))
    .all();

  if (!activeShift) {
    return { success: false, error: 'لا توجد وردية نشطة' };
  }

  // Update stoppedAt
  const now = new Date().toISOString();

  try {
    db.update(shiftSessions)
      .set({ stoppedAt: now })
      .where(eq(shiftSessions.id, activeShift.id))
      .run();

    return { success: true, data: true };
  } catch (e) {
    console.error('stopShift error:', e);
    return { success: false, error: 'فشل في إنهاء الوردية' };
  }
}

export async function getActiveShift(): Promise<ActionResult<{
  id: string;
  startedAt: string;
  startedBy: string;
} | null>> {
  // No role restriction - cashier can call this too
  try {
    const [activeShift] = db.select({
      id: shiftSessions.id,
      startedAt: shiftSessions.startedAt,
      startedBy: shiftSessions.startedBy,
    })
    .from(shiftSessions)
    .where(isNull(shiftSessions.stoppedAt))
    .all();

    if (!activeShift) {
      return { success: true, data: null };
    }

    return { success: true, data: activeShift };
  } catch (e) {
    console.error('getActiveShift error:', e);
    return { success: false, error: 'فشل في جلب معلومات الوردية' };
  }
}
