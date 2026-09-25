'use client';
import { useState, useEffect } from 'react';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { OrderCart } from '@/components/pos/OrderCart';
import { ActiveOrdersTable } from '@/components/pos/ActiveOrdersTable';
import { Settings, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTodayCompletedOrdersCount } from '@/server/actions/order.actions';
import { getActiveShift } from '@/server/actions/shift.actions';
import { ShiftTimer } from '@/components/pos/ShiftTimer';

export default function POSPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [dailyOrders, setDailyOrders] = useState(0);
  const [activeShiftStartedAt, setActiveShiftStartedAt] = useState<string | null>(null);

  function handleBackToDashboard() {
    router.push('/');
  }

  async function loadDailyOrders() {
    const result = await getTodayCompletedOrdersCount();
    if (result.success) setDailyOrders(result.data);
  }

  async function loadActiveShift() {
    const result = await getActiveShift();
    if (result.success) {
      setActiveShiftStartedAt(result.data?.startedAt || null);
    }
  }

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
      
      setCurrentDate(now.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }));
    }
    
    updateTime();
    loadDailyOrders();
    loadActiveShift();
    const interval = setInterval(updateTime, 1000);
    // Also poll for shift changes every 2 seconds
    const shiftInterval = setInterval(loadActiveShift, 2000);
    return () => {
      clearInterval(interval);
      clearInterval(shiftInterval);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#F2EDE2' }}>
        {/* Header - Prototype Design */}
        <header className="shrink-0 px-4 sm:px-6 lg:px-7 flex items-center justify-between gap-4" style={{ height: '68px', minHeight: '68px', backgroundColor: '#0F0C03', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
          {/* Brand Section */}
          <div className="flex items-center gap-2 sm:gap-0 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0" style={{ borderRadius: '6px', filter: 'brightness(1.05)' }}>
              <span className="text-xl sm:text-2xl font-bold" style={{ color: '#C9A84C' }}>F</span>
            </div>
            <div className="w-px h-6 sm:h-8 mx-2 sm:mx-4 shrink-0" style={{ background: 'rgba(201,168,76,0.25)' }}></div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base sm:text-xl font-bold tracking-wider" style={{ fontFamily: 'Outfit, monospace', color: '#C9A84C', lineHeight: 1 }}>F2M BURGER</span>
              <span className="text-xs sm:text-sm italic hidden sm:block" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#A0906A', letterSpacing: '0.5px', lineHeight: 1 }}>Gourmet Flavors, Sustainably Crafted</span>
            </div>
          </div>

          {/* Shift Timer Section - Center */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <ShiftTimer startedAt={activeShiftStartedAt} />
            <div className="text-xs sm:text-sm hidden sm:block" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#A0906A', letterSpacing: '0.5px' }}>{currentDate}</div>
          </div>

          {/* Right Info Section */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-full" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <span className="text-xs sm:text-sm" style={{ color: '#A0906A', letterSpacing: '0.3px' }}>طلبات اليوم</span>
              <span className="text-lg sm:text-xl font-bold min-w-5 sm:min-w-6 text-center" style={{ fontFamily: 'Outfit, monospace', color: '#E8D08A' }}>{dailyOrders}</span>
            </div>
            
            {/* Back Button */}
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium hidden sm:block">الخلف</span>
            </button>
          </div>
        </header>

        {/* Main Body - Prototype Layout */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Side - Products + Active Orders */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ padding: '12px 10px 12px 14px', gap: '12px' }}>
            {/* Products Panel */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <ProductGrid searchQuery={searchQuery} />
            </div>
            
            {/* Active Orders Panel */}
            <div className="flex-shrink-0 overflow-hidden" style={{ height: 'min(35%, 250px)', minHeight: '180px' }}>
              <ActiveOrdersTable onOrderConfirmed={loadDailyOrders} />
            </div>
          </div>

          {/* Right Side - Cart Panel */}
          <div className="flex-shrink-0 bg-white overflow-hidden" style={{ width: 'min(55%, 500px)', margin: '12px 12px 0 0', borderRadius: '20px 20px 0 0', boxShadow: '0 20px 60px rgba(139,105,20,0.18)', border: '1px solid #DDD4B6', borderBottom: 'none' }}>
            <OrderCart />
          </div>
        </div>

        {/* Footer Bar */}
        <footer className="shrink-0 flex items-center justify-between px-3 sm:px-5 lg:px-7 gap-2" style={{ height: '44px', minHeight: '44px', backgroundColor: '#0F0C03', borderTop: '1px solid rgba(201,168,76,0.12)' }}>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-bold tracking-wider" style={{ fontFamily: 'Outfit, monospace', color: '#C9A84C', letterSpacing: '2px' }}>F2M</span>
            <span style={{ color: 'rgba(201,168,76,0.3)' }}>·</span>
            <span className="text-xs sm:text-sm hidden sm:block" style={{ color: '#A0906A', letterSpacing: '0.5px' }}>مدينة النبك</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a href="/login" className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', textDecoration: 'none' }}>
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </a>
          </div>
        </footer>
      </div>
  );
}
