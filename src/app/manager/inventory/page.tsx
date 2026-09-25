'use client';

import { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { ReportChart } from '@/components/manager/ReportChart';
import { getReportSummary } from '@/server/actions/report.actions';
import { clearProductRecords, clearSalesRecords } from '@/server/actions/user.actions';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, DollarSign, LogOut, PackageX, ReceiptText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
const periodLabels: Record<Period, string> = { daily: 'اليوم', weekly: 'آخر 7 أيام', monthly: 'آخر 30 يوماً', yearly: 'آخر سنة' };

export default function ManagerInventoryPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [period, setPeriod] = useState<Period>('daily');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const managerName = (session?.user as any)?.name || 'المدير';
  
  const [showClearProductsModal, setShowClearProductsModal] = useState(false);
  const [showClearSalesModal, setShowClearSalesModal] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadReport(selectedPeriod = period) {
    setLoading(true); setError(null);
    const result = await getReportSummary({ period: selectedPeriod });
    if (result.success) setReport(result.data); else setError(result.error);
    setLoading(false);
  }

  async function handleClearProducts() {
    if (!clearPassword) {
      setModalError('كلمة المرور مطلوبة');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(false);

    const result = await clearProductRecords(clearPassword);
    
    if (result.success) {
      setModalSuccess(true);
      setClearPassword('');
      setTimeout(() => {
        setShowClearProductsModal(false);
        setModalSuccess(false);
        window.location.reload();
      }, 2000);
    } else {
      setModalError(result.error);
    }

    setIsSubmitting(false);
  }

  async function handleClearSales() {
    if (!clearPassword) {
      setModalError('كلمة المرور مطلوبة');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    setModalSuccess(false);

    const result = await clearSalesRecords(clearPassword);
    
    if (result.success) {
      setModalSuccess(true);
      setClearPassword('');
      setTimeout(() => {
        setShowClearSalesModal(false);
        setModalSuccess(false);
        window.location.reload();
      }, 2000);
    } else {
      setModalError(result.error);
    }

    setIsSubmitting(false);
  }

  useEffect(() => { loadReport(period); }, [period]);

  return (
    <RoleGuard allowedRole="manager">
      <div className="min-h-screen bg-[#F2EDE2]" dir="rtl">
        <header className="h-[68px] px-4 sm:px-7 flex items-center justify-between bg-[#0F0C03] border-b border-amber-200/15">
          <button onClick={() => router.push('/manager/dashboard')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20"><ArrowLeft className="w-4 h-4" /><span className="text-sm">العودة</span></button>
          <div className="text-center"><p className="text-base sm:text-lg font-semibold text-[#C9A84C]">تقارير المبيعات</p><p className="text-xs text-[#A0906A]">{managerName}</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowClearProductsModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"><span className="text-sm hidden sm:inline">مسح المنتجات</span></button>
            <button onClick={() => setShowClearSalesModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"><span className="text-sm hidden sm:inline">مسح المبيعات</span></button>
            <button onClick={() => router.push('/logout')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-white/10 hover:bg-white/20"><LogOut className="w-4 h-4" /><span className="text-sm hidden sm:inline">تسجيل الخروج</span></button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
          <section className="bg-white rounded-2xl border border-[#DDD4B6] p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div><div className="flex items-center gap-2 text-[#8B6914]"><CalendarDays className="w-5 h-5" /><h1 className="text-lg font-bold">ملخص الأداء</h1></div><p className="text-sm text-gray-500 mt-1">يعرض الطلبات المكتملة والمنتجات المباعة ضمن الفترة المختارة فقط.</p></div>
              <div className="flex flex-wrap gap-2">{(Object.keys(periodLabels) as Period[]).map(item => <button key={item} onClick={() => setPeriod(item)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={period === item ? { background: '#8B6914', color: '#fff' } : { background: '#F6F0DC', color: '#6B5E3A' }}>{periodLabels[item]}</button>)}</div>
            </div>
          </section>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
          {loading ? <div className="bg-white rounded-2xl border border-[#DDD4B6] py-20 text-center text-gray-500">جارٍ تحميل التقرير…</div> : report && <>
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <Metric icon={<DollarSign />} label="الإيراد" value={`${report.totalRevenue.toFixed(2)} ل.س`} tone="amber" />
              <Metric icon={<ReceiptText />} label="إجمالي الطلبات" value={report.totalOrders} tone="slate" />
              <Metric icon={<CheckCircle2 />} label="مكتملة" value={report.completedOrders} tone="green" />
              <Metric icon={<Clock3 />} label="قيد التنفيذ" value={report.pendingOrders} tone="blue" />
              <Metric icon={<PackageX />} label="ملغاة" value={report.cancelledOrders} tone="red" />
            </section>
            <section className="grid lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3 bg-white rounded-2xl border border-[#DDD4B6] p-4 sm:p-6"><h2 className="font-bold text-gray-900">الأصناف الأكثر مبيعاً</h2><p className="text-sm text-gray-500 mt-1 mb-4">الكمية المباعة خلال {periodLabels[period]}</p><ReportChart data={report.topProducts} /></div>
              <div className="lg:col-span-2 bg-[#1A1607] rounded-2xl p-5 sm:p-6 text-white flex flex-col justify-center"><p className="text-sm text-[#A0906A]">متوسط قيمة الطلب المكتمل</p><p className="text-3xl sm:text-4xl font-bold text-[#E8D08A] mt-2">{report.averageOrderValue.toFixed(2)} <span className="text-base">ل.س</span></p><div className="mt-6 pt-4 border-t border-white/10 text-sm text-[#C9A84C]">{report.topProducts.length} أصناف مباعة في هذه الفترة</div></div>
            </section>
            <section className="bg-white rounded-2xl border border-[#DDD4B6] overflow-hidden"><div className="p-4 sm:p-5 border-b border-gray-100"><h2 className="font-bold text-gray-900">تفصيل المنتجات المباعة</h2><p className="text-sm text-gray-500 mt-1">لا تظهر المنتجات غير المباعة أو مبيعات فترات أخرى.</p></div>
              {report.topProducts.length === 0 ? <div className="py-12 text-center text-gray-500">لا توجد مبيعات مكتملة في هذه الفترة.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[520px]"><thead className="bg-[#F6F0DC] text-right text-sm text-[#6B5E3A]"><tr><th className="px-5 py-3">الترتيب</th><th className="px-5 py-3">المنتج</th><th className="px-5 py-3">الكمية</th><th className="px-5 py-3">الإيراد</th></tr></thead><tbody>{report.topProducts.map((item: any, index: number) => <tr key={item.productId} className="border-t border-gray-100"><td className="px-5 py-4 text-[#8B6914] font-bold">#{index + 1}</td><td className="px-5 py-4 font-medium text-gray-900">{item.productName}</td><td className="px-5 py-4 text-gray-700">{item.quantity}</td><td className="px-5 py-4 font-bold text-[#8B6914]">{item.revenue.toFixed(2)} ل.س</td></tr>)}</tbody></table></div>}
            </section>
          </>}

        {/* Clear Products Modal */}
        <Modal
          isOpen={showClearProductsModal}
          onClose={() => {
            setShowClearProductsModal(false);
            setModalError(null);
            setModalSuccess(false);
            setClearPassword('');
          }}
          title="مسح سجلات المنتجات">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              هل أنت متأكد من مسح جميع سجلات المنتجات؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            {modalSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700 text-center">تم مسح سجلات المنتجات بنجاح</p>
              </div>
            )}
            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 text-center">{modalError}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">كلمة المرور للتأكيد</label>
              <input
                type="password"
                value={clearPassword}
                onChange={(e) => setClearPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="أدخل كلمة المرور"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowClearProductsModal(false);
                  setModalError(null);
                  setModalSuccess(false);
                  setClearPassword('');
                }}
                className="flex-1">
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handleClearProducts}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700">
                {isSubmitting ? 'جاري المسح...' : 'تأكيد المسح'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Clear Sales Modal */}
        <Modal
          isOpen={showClearSalesModal}
          onClose={() => {
            setShowClearSalesModal(false);
            setModalError(null);
            setModalSuccess(false);
            setClearPassword('');
          }}
          title="مسح سجلات المبيعات">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              هل أنت متأكد من مسح جميع سجلات المبيعات؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            {modalSuccess && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700 text-center">تم مسح سجلات المبيعات بنجاح</p>
              </div>
            )}
            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 text-center">{modalError}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">كلمة المرور للتأكيد</label>
              <input
                type="password"
                value={clearPassword}
                onChange={(e) => setClearPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                placeholder="أدخل كلمة المرور"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowClearSalesModal(false);
                  setModalError(null);
                  setModalSuccess(false);
                  setClearPassword('');
                }}
                className="flex-1">
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handleClearSales}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700">
                {isSubmitting ? 'جاري المسح...' : 'تأكيد المسح'}
              </Button>
            </div>
          </div>
        </Modal>
        </main>
      </div>
    </RoleGuard>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: 'amber' | 'slate' | 'green' | 'blue' | 'red' }) {
  const colors = { amber: 'text-[#8B6914] bg-amber-50', slate: 'text-slate-700 bg-slate-100', green: 'text-green-700 bg-green-50', blue: 'text-blue-700 bg-blue-50', red: 'text-red-700 bg-red-50' };
  return <div className="bg-white rounded-2xl border border-[#DDD4B6] p-4"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[tone]}`}>{icon}</div><p className="text-sm text-gray-500 mt-3">{label}</p><p className="text-xl font-bold text-gray-900 mt-1">{value}</p></div>;
}
