'use client';
import { Play, Square } from 'lucide-react';
import { useState, useEffect } from 'react';
import { startShift, stopShift } from '@/server/actions/shift.actions';
import { useRouter } from 'next/navigation';

interface ShiftControlProps {
  activeShift: { id: string; startedAt: string; startedBy: string } | null;
}

export function ShiftControl({ activeShift }: ShiftControlProps) {
  const router = useRouter();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localActiveShift, setLocalActiveShift] = useState<{ id: string; startedAt: string; startedBy: string } | null>(activeShift);

  // Sync local state with prop
  useEffect(() => {
    setLocalActiveShift(activeShift);
  }, [activeShift]);

  // Update timer every second if shift is active
  useEffect(() => {
    if (!localActiveShift) {
      setElapsedTime(0);
      return;
    }

    const calculateElapsed = () => {
      const elapsed = Math.floor((Date.now() - new Date(localActiveShift.startedAt).getTime()) / 1000);
      setElapsedTime(elapsed);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [localActiveShift]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format with Arabic numerals
    const formatNumber = (num: number) => 
      num.toLocaleString('ar-SA', { minimumIntegerDigits: 2, useGrouping: false });

    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(secs)}`;
  };

  const formatStartedAt = (startedAt: string) => {
    return new Date(startedAt).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartShift = async () => {
    setIsSubmitting(true);
    const result = await startShift();
    setIsSubmitting(false);

    if (result.success) {
      // Update local state immediately for instant UI feedback
      setLocalActiveShift({
        id: result.data.shiftId,
        startedAt: new Date().toISOString(),
        startedBy: 'current-user'
      });
      // Still refresh to sync with server
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const handleStopShift = async () => {
    setIsSubmitting(true);
    const result = await stopShift();
    setIsSubmitting(false);

    if (result.success) {
      // Update local state immediately for instant UI feedback
      setLocalActiveShift(null);
      // Still refresh to sync with server
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
      {localActiveShift ? (
        <>
          <button
            onClick={handleStopShift}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <Square className="w-5 h-5" />
            {isSubmitting ? 'جاري الإنهاء...' : 'إنهاء الوردية'}
          </button>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-gray-500">الوردية بدأت: {formatStartedAt(localActiveShift.startedAt)}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--brand-primary, #C9A84C)', fontFamily: 'Outfit, monospace' }}>
              {formatTime(elapsedTime)}
            </p>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={handleStartShift}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-green-500 hover:bg-green-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            <Play className="w-5 h-5" />
            {isSubmitting ? 'جاري البدء...' : 'بدء الوردية'}
          </button>
          <p className="mt-3 text-sm text-gray-400">لا توجد وردية نشطة حالياً</p>
        </>
      )}
    </div>
  );
}
