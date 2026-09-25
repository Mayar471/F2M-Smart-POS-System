'use client';
import { useSession } from 'next-auth/react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { BarChart2, UtensilsCrossed, LogOut, KeyRound, TrendingUp, CheckCircle, ChevronLeft, TrendingDown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { changePassword, getDashboardStats, getYesterdayStats, getRecentOrders, getAlerts, getAverageOrdersForDay } from '@/server/actions/user.actions';
import { getReportSummary } from '@/server/actions/report.actions';
import { getActiveShift } from '@/server/actions/shift.actions';
import { ShiftControl } from '@/components/manager/ShiftControl';

export default function ManagerDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const managerName = user?.name || 'المدير';
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [stats, setStats] = useState({
    todayRevenue: 0,
    completedOrders: 0,
    activeProducts: 0
  });
  const [yesterdayStats, setYesterdayStats] = useState({
    yesterdayRevenue: 0,
    yesterdayCompletedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; customerName: string | null; totalAmount: number; status: string }>>([]);
  const [alerts, setAlerts] = useState({
    disabledProducts: 0,
    cancelledOrdersToday: 0
  });
  const [averageOrders, setAverageOrders] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeShift, setActiveShift] = useState<{ id: string; startedAt: string; startedBy: string } | null>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'صباح الخير';
    if (hour >= 12 && hour < 17) return 'مساء النور';
    if (hour >= 17 && hour < 24) return 'مساء الخير';
    return 'أهلاً';
  };

  // Format time in English
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Calculate percentage change
  const calculateChange = (today: number, yesterday: number) => {
    if (yesterday === 0) return null;
    const change = ((today - yesterday) / yesterday) * 100;
    return Math.round(change * 10) / 10; // Round to 1 decimal place
  };

  // Render comparison badge
  const renderComparison = (today: number, yesterday: number) => {
    const change = calculateChange(today, yesterday);
    if (change === null) return null;
    
    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <TrendingUp className="w-3 h-3" />
          <span>+{change}% مقارنة بالأمس</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <TrendingDown className="w-3 h-3" />
          <span>{change}% مقارنة بالأمس</span>
        </div>
      );
    } else {
      return <div className="text-xs text-gray-500">لا يوجد تغيير</div>;
    }
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'منجز', bgColor: 'bg-green-100', textColor: 'text-green-700' },
      pending: { label: 'قيد التنفيذ', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
      cancelled: { label: 'ملغى', bgColor: 'bg-red-100', textColor: 'text-red-700' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  // Get current shift name
  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'الوردية الصباحية';
    if (hour >= 14 && hour < 22) return 'الوردية المسائية';
    return 'وردية الليل';
  };

  // Get Arabic day name
  const getArabicDayName = (dayIndex: number) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayIndex];
  };

  // Format time for status bar
  const formatTimeShort = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Fetch stats on load
  useEffect(() => {
    async function fetchStats() {
      try {
        // Get today's stats from report summary
        const reportResult = await getReportSummary({ period: 'daily' });
        if (reportResult.success) {
          setStats({
            todayRevenue: reportResult.data.totalRevenue,
            completedOrders: reportResult.data.completedOrders,
            activeProducts: 0 // Will fetch separately
          });
        }

        // Get active products count from server action
        const statsResult = await getDashboardStats();
        if (statsResult.success) {
          setStats(prev => ({
            ...prev,
            activeProducts: statsResult.data.activeProducts
          }));
        }

        // Get yesterday stats for comparison
        const yesterdayResult = await getYesterdayStats();
        if (yesterdayResult.success) {
          setYesterdayStats(yesterdayResult.data);
        }

        // Get recent orders
        const recentOrdersResult = await getRecentOrders();
        if (recentOrdersResult.success) {
          setRecentOrders(recentOrdersResult.data);
        }

        // Get alerts
        const alertsResult = await getAlerts();
        if (alertsResult.success) {
          setAlerts(alertsResult.data);
        }

        // Get average orders for progress bar
        const averageResult = await getAverageOrdersForDay();
        if (averageResult.success) {
          setAverageOrders(averageResult.data);
        }

        // Get active shift
        const shiftResult = await getActiveShift();
        if (shiftResult.success) {
          setActiveShift(shiftResult.data);
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      } finally {
        setLoadingStats(false);
      }
    }
    
    fetchStats();
    // Poll for shift changes every 2 seconds
    const shiftInterval = setInterval(async () => {
      const shiftResult = await getActiveShift();
      if (shiftResult.success) {
        setActiveShift(shiftResult.data);
      }
    }, 2000);
    
    return () => clearInterval(shiftInterval);
  }, []);

  function handleLogout() {
    router.push('/logout');
  }

  async function handlePasswordChange() {
    if (!oldPassword || !newPassword) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await changePassword({ oldPassword, newPassword });
    
    if (result.success) {
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <RoleGuard allowedRole="manager">
      <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#F2EDE2' }}>
        {/* Header - POS Style */}
        <header className="shrink-0 px-4 sm:px-6 lg:px-7 flex items-center justify-between gap-4" style={{ height: '68px', minHeight: '68px', backgroundColor: '#0F0C03', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
          {/* Brand Section */}
          <div className="flex items-center gap-2 sm:gap-0 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0" style={{ borderRadius: '6px', filter: 'brightness(1.05)' }}>
              <span className="text-xl sm:text-2xl font-bold" style={{ color: '#C9A84C' }}>F</span>
            </div>
            <div className="w-px h-6 sm:h-8 mx-2 sm:mx-4 shrink-0" style={{ background: 'rgba(201,168,76,0.25)' }}></div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base sm:text-xl font-bold tracking-wider" style={{ fontFamily: 'Outfit, monospace', color: '#C9A84C', lineHeight: 1 }}>F2M BURGER</span>
              <span className="text-xs sm:text-sm italic hidden sm:block" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#A0906A', letterSpacing: '0.5px', lineHeight: 1 }}>إدارة النظام</span>
            </div>
          </div>

          {/* Center Info */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="text-lg sm:text-xl font-semibold" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif', color: '#C9A84C', lineHeight: 1 }}>{managerName}</div>
            <div className="text-sm sm:text-base hidden sm:block font-mono" style={{ fontFamily: 'Outfit, monospace', color: '#A0906A', letterSpacing: '0.5px' }}>{formatTime(currentTime)}</div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10">
              <KeyRound className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:block">تغيير كلمة المرور</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:block">تسجيل الخروج</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Shift Control */}
            <ShiftControl activeShift={activeShift} />

            {/* System Status Bar */}
            <div className="bg-white rounded-xl px-4 py-2 mb-4 border border-gray-100 shadow-sm flex flex-row-reverse items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-600">النظام يعمل بكفاءة</span>
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <span className="text-xs text-gray-500">الوردية الحالية: {getCurrentShift()}</span>
              <div className="w-px h-4 bg-gray-200"></div>
              <span className="text-xs text-gray-500">الوقت: {formatTimeShort(currentTime)}</span>
            </div>

            {/* Greeting Section */}
            <div className="text-right">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
                {getGreeting()}، {managerName}
              </h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today's Revenue */}
              <div className="bg-white rounded-2xl shadow-sm p-5 border-t-2" style={{ borderColor: 'var(--brand-primary, #C9A84C)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">إيرادات اليوم</p>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, monospace' }}>
                      {loadingStats ? '...' : stats.todayRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ل.س
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
                </div>
                {!loadingStats && renderComparison(stats.todayRevenue, yesterdayStats.yesterdayRevenue)}
              </div>

              {/* Completed Orders */}
              <div className="bg-white rounded-2xl shadow-sm p-5 border-t-2" style={{ borderColor: 'var(--brand-primary, #C9A84C)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">طلبات منجزة</p>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, monospace' }}>
                      {loadingStats ? '...' : stats.completedOrders} طلباً
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
                </div>
                {!loadingStats && renderComparison(stats.completedOrders, yesterdayStats.yesterdayCompletedOrders)}
                {!loadingStats && averageOrders > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, Math.round((stats.completedOrders / averageOrders) * 100))}%`,
                          backgroundColor: 'var(--brand-primary, #C9A84C)' 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {Math.min(100, Math.round((stats.completedOrders / averageOrders) * 100))}٪ من متوسط يوم {getArabicDayName(new Date().getDay())}
                    </p>
                  </div>
                )}
              </div>

              {/* Active Products */}
              <div className="bg-white rounded-2xl shadow-sm p-5 border-t-2" style={{ borderColor: 'var(--brand-primary, #C9A84C)' }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">أصناف نشطة</p>
                    <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, monospace' }}>
                      {loadingStats ? '...' : stats.activeProducts} صنفاً
                    </p>
                  </div>
                  <UtensilsCrossed className="w-6 h-6" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
                </div>
              </div>
            </div>

            {/* Smart Alerts Section */}
            {(alerts.disabledProducts > 0 || alerts.cancelledOrdersToday > 3) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-amber-800 font-semibold">تنبيهات تحتاج انتباهك</h3>
                </div>
                <ul className="space-y-1">
                  {alerts.disabledProducts > 0 && (
                    <li className="text-amber-700 text-sm py-1">
                      • يوجد {alerts.disabledProducts} صنف معطّل حالياً — قد يؤثر على المبيعات
                    </li>
                  )}
                  {alerts.cancelledOrdersToday > 3 && (
                    <li className="text-amber-700 text-sm py-1">
                      • تم إلغاء {alerts.cancelledOrdersToday} طلبات اليوم — يُنصح بمراجعة الأسباب
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/manager/inventory" className="group">
                <div className="h-full bg-white rounded-2xl border border-gray-200 hover:border-[var(--brand-primary)] hover:shadow-md transition-all duration-200 p-5 cursor-pointer min-h-[160px] relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(201,168,76,0.1)' }}>
                        <BarChart2 className="w-5 h-5" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
                        تحليل الأداء والمبيعات
                      </h3>
                      <p className="text-sm text-gray-500">
                        استعراض الإيرادات والطلبات والأصناف الأكثر مبيعاً
                      </p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </Link>

              <Link href="/manager/menu" className="group">
                <div className="h-full bg-white rounded-2xl border border-gray-200 hover:border-[var(--brand-primary)] hover:shadow-md transition-all duration-200 p-5 cursor-pointer min-h-[160px] relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(201,168,76,0.1)' }}>
                        <UtensilsCrossed className="w-5 h-5" style={{ color: 'var(--brand-primary, #C9A84C)' }} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
                        إدارة القائمة والأسعار
                      </h3>
                      <p className="text-sm text-gray-500">
                        إضافة الأصناف وتعديل الأسعار والتحكم في التوفر
                      </p>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Last 5 Orders Table */}
            <div>
              <h2 className="text-right font-semibold text-gray-800 mb-3">آخر النشاطات</h2>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {recentOrders.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">لا توجد طلبات مسجلة بعد</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wide py-2 px-4">رقم الطلب</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wide py-2 px-4">اسم العميل</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wide py-2 px-4">الإجمالي</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wide py-2 px-4">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, index) => (
                        <tr 
                          key={order.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${index === recentOrders.length - 1 ? 'border-b-0' : ''}`}
                        >
                          <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                            {order.id.substring(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                            {order.customerName || 'بدون اسم'}
                          </td>
                          <td className="py-3 px-4 text-sm font-bold" style={{ color: 'var(--brand-primary, #C9A84C)' }}>
                            {order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ل.س
                          </td>
                          <td className="py-3 px-4">
                            {renderStatusBadge(order.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setError(null);
            setSuccess(false);
            setOldPassword('');
            setNewPassword('');
          }}
          title="تغيير كلمة المرور">
          <div className="space-y-4">
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700 text-center">تم تغيير كلمة المرور بنجاح</p>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 text-center">{error}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">كلمة المرور القديمة</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="أدخل كلمة المرور القديمة"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPasswordModal(false);
                  setError(null);
                  setSuccess(false);
                  setOldPassword('');
                  setNewPassword('');
                }}
                className="flex-1">
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handlePasswordChange}
                disabled={isSubmitting}
                className="flex-1">
                {isSubmitting ? 'جاري التغيير...' : 'تأكيد'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  );
}
