import { syncPendingOrders } from './sync.worker';

let isRunning = false;
let lastSyncTime: Date | null = null;
let lastResult: any = null;

export async function runSyncScheduler(): Promise<void> {
  if (isRunning) {
    console.log('[Sync] Already running, skipping');
    return;
  }

  isRunning = true;
  console.log('[Sync] Starting sync...');

  try {
    const result = await syncPendingOrders();
    lastSyncTime = new Date();
    lastResult = result;
    
    console.log('[Sync] Completed:', {
      synced: result.synced,
      failed: result.failed,
      errors: result.errors.length,
    });
  } catch (e) {
    console.error('[Sync] Failed:', e);
  } finally {
    isRunning = false;
  }
}

export function getSyncStatus() {
  return {
    isRunning,
    lastSyncTime,
    lastResult,
  };
}

// Auto-sync every 5 minutes (300000ms)
if (typeof window === 'undefined') {
  setInterval(() => {
    runSyncScheduler().catch(console.error);
  }, 300000);
}
