import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runSyncScheduler, getSyncStatus } from '@/server/sync/sync.scheduler';
import { syncLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db';

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = getSyncStatus();
  
  // Get sync log stats
  const allLogs = db.select().from(syncLog).all();
  const stats = {
    total: allLogs.length,
    pending: allLogs.filter(l => l.status === 'pending').length,
    synced: allLogs.filter(l => l.status === 'synced').length,
    failed: allLogs.filter(l => l.status === 'failed').length,
  };

  return NextResponse.json({ ...status, stats });
}

export async function POST() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'manager') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await runSyncScheduler();
  
  return NextResponse.json({ success: true, message: 'Sync triggered' });
}
