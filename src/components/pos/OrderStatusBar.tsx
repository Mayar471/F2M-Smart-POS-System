'use client';
import { useState, useEffect } from 'react';
import { getActiveOrders, updateOrderStatus } from '@/server/actions/order.actions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export function OrderStatusBar() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    const result = await getActiveOrders();
    if (result.success) {
      setOrders(result.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleComplete(orderId: string) {
    const result = await updateOrderStatus({ orderId, status: 'completed' });
    if (result.success) {
      setOrders(orders.filter(o => o.id !== orderId));
    } else {
      setError(result.error);
    }
  }

  function handleCancelClick(order: any) {
    setSelectedOrder(order);
    setCancellationReason('');
    setError(null);
  }

  async function handleCancelConfirm() {
    if (!selectedOrder || !cancellationReason.trim()) return;
    
    setIsSubmitting(true);
    setError(null);

    const result = await updateOrderStatus({
      orderId: selectedOrder.id,
      status: 'cancelled',
      cancellationReason: cancellationReason.trim(),
    });

    if (result.success) {
      setOrders(orders.filter(o => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      setCancellationReason('');
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending': return <Badge variant="warning">قيد المعالجة</Badge>;
      case 'completed': return <Badge variant="success">مكتمل</Badge>;
      case 'cancelled': return <Badge variant="danger">ملغي</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  }

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">الطلبات النشطة ({orders.length})</h3>
      </div>
      
      {loading ? (
        <div className="p-4 text-center text-gray-400 text-sm">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="p-4 text-center text-gray-400 text-sm">لا توجد طلبات نشطة</div>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          {orders.map(order => (
            <div key={order.id} className="p-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">#{order.id.slice(-6)}</span>
                  {getStatusBadge(order.status)}
                </div>
                <p className="text-sm font-semibold text-[var(--brand-primary)]">
                  {Number(order.totalAmount).toFixed(2)} ل.س
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleComplete(order.id)}>
                  مكتمل
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleCancelClick(order)}>
                  إلغاء
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="إلغاء الطلب">
        <div className="space-y-4">
          <Input
            label="سبب الإلغاء"
            value={cancellationReason}
            onChange={e => setCancellationReason(e.target.value)}
            placeholder="أدخل سبب الإلغاء..."
            error={error || undefined}
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setSelectedOrder(null)}
              className="flex-1">
              إلغاء
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelConfirm}
              disabled={!cancellationReason.trim() || isSubmitting}
              loading={isSubmitting}
              className="flex-1">
              تأكيد الإلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
