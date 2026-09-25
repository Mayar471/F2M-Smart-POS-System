'use client';
import { useState, useEffect } from 'react';
import { getActiveOrders, updateOrderStatus, getOrderDetails } from '@/server/actions/order.actions';
import { Check, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCartStore } from '@/store/cart.store';
import type { OrderChannel } from '@/types';

type ActiveOrder = {
  id: string;
  customerName?: string | null;
  totalAmount: number;
  channel: OrderChannel;
};

const formatOrderNumber = (id: string) => id.replace(/\D/g, '') || '0';

export function ActiveOrdersTable({ onOrderConfirmed }: { onOrderConfirmed?: () => void }) {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedChannel = useCartStore(s => s.channel);

  async function loadOrders() {
    setLoading(true);
    const result = await getActiveOrders();
    if (result.success) {
      // Filter orders by selected channel
      const filteredOrders = result.data.filter(order => order.channel === selectedChannel);
      setOrders(filteredOrders);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // Refresh every 10 seconds
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [selectedChannel]);

  async function handleConfirm(orderId: string) {
    const result = await updateOrderStatus({
      orderId,
      status: 'completed',
    });
    if (result.success) {
      loadOrders();
      onOrderConfirmed?.();
    } else {
      setError(result.error);
    }
  }

  async function handleCancel() {
    if (!cancellingOrder) {
      return;
    }
    const result = await updateOrderStatus({
      orderId: cancellingOrder,
      status: 'cancelled',
    });
    if (result.success) {
      setCancellingOrder(null);
      setError(null);
      loadOrders();
    } else {
      setError(result.error);
    }
  }

  const loadOrder = useCartStore(s => s.loadOrder);

  const channelLabels: Record<OrderChannel, string> = {
    drive_thru: 'سيارة',
    dine_in: 'قاعة',
    delivery: 'توصيل',
  };

  async function handleEdit(order: ActiveOrder) {
    setError(null);
    const result = await getOrderDetails(order.id);
    if (result.success) {
      const { order: orderData, items } = result.data;
      loadOrder(
        orderData.id,
        orderData.customerName || '',
        orderData.channel || 'dine_in',
        orderData.notes || '',
        items
      );
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white flex items-center justify-end">
        <h2 className="text-sm sm:text-base font-semibold text-gray-800 text-right">
          الطلبات النشطة ({orders.length})
        </h2>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center text-gray-400 py-6 sm:py-8 text-sm">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-400 py-6 sm:py-8 text-sm">لا توجد طلبات نشطة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">رقم الطلب</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">اسم العميل</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">نوع الطلب</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">الإجمالي</th>
                  <th className="px-4 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id} className={`border-b border-gray-100 hover:bg-amber-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 font-medium">{formatOrderNumber(order.id)}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{order.customerName || formatOrderNumber(order.id)}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{channelLabels[order.channel as OrderChannel] || order.channel}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-amber-700">{Number(order.totalAmount).toFixed(2)} ل.س</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex gap-1 sm:gap-2">
                        {/* تعديل (Modify) - Blue */}
                        <button
                          onClick={() => handleEdit(order)}
                          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[10px] sm:text-xs font-medium transition-colors shadow-sm"
                          title="تعديل">
                          <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">تعديل</span>
                        </button>
                        
                        {/* إلغاء (Cancel) - Red */}
                        <button
                          onClick={() => setCancellingOrder(order.id)}
                          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] sm:text-xs font-medium transition-colors shadow-sm"
                          title="إلغاء">
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">إلغاء</span>
                        </button>
                        
                        {/* تأكيد (Confirm) - Green */}
                        <button
                          onClick={() => handleConfirm(order.id)}
                          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-[10px] sm:text-xs font-medium transition-colors shadow-sm"
                          title="تأكيد">
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">تأكيد</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      <Modal
        isOpen={cancellingOrder !== null}
        onClose={() => {
          setCancellingOrder(null);
          setError(null);
        }}
        title="تأكيد إلغاء الطلب">
        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <p className="text-sm text-gray-700">هل أنت متأكد من أنك تريد إلغاء هذا الطلب؟</p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCancellingOrder(null);
                setError(null);
              }}
              className="flex-1">
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              className="flex-1">
              تأكيد الإلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
