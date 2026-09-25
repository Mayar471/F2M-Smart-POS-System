'use client';
import { useState, useEffect } from 'react';

interface ShiftTimerProps {
  startedAt: string | null;
}

export function ShiftTimer({ startedAt }: ShiftTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [localStartedAt, setLocalStartedAt] = useState<string | null>(startedAt);

  // Sync local state with prop
  useEffect(() => {
    setLocalStartedAt(startedAt);
  }, [startedAt]);

  // Update timer every second if shift is active
  useEffect(() => {
    if (!localStartedAt) {
      setElapsedTime(0);
      return;
    }

    const calculateElapsed = () => {
      const elapsed = Math.floor((Date.now() - new Date(localStartedAt).getTime()) / 1000);
      setElapsedTime(elapsed);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [localStartedAt]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format with Arabic numerals
    const formatNumber = (num: number) => 
      num.toLocaleString('ar-SA', { minimumIntegerDigits: 2, useGrouping: false });

    return `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(secs)}`;
  };

  if (!localStartedAt) {
    return (
      <div className="text-sm text-gray-400">لا توجد وردية نشطة</div>
    );
  }

  return (
    <div className="text-2xl sm:text-3xl font-semibold tracking-wider" style={{ fontFamily: 'Outfit, monospace', color: '#C9A84C', lineHeight: 1 }}>
      {formatTime(elapsedTime)}
    </div>
  );
}
