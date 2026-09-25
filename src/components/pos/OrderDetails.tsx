'use client';
import { useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { createOrder, updateOrder } from '@/server/actions/order.actions';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Truck, Utensils, Car, Package, XCircle, User, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { OrderChannel } from '@/types';

export function OrderDetails() {
  const { items, channel, notes, customerName, activeOrderId,
          setChannel, setNotes, setCustomerName, clearCart, subtotal, cancelEdit } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerNameError, setCustomerNameError] = useState<string | null>(null);

  async function handleSubmit() {
    if (items.length === 0) return;
    
    // Validate customer name
    if (!customerName.trim()) {
      setCustomerNameError('اسم العميل مطلوب');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setCustomerNameError(null);

    const orderData = {
      channel,
      items: items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      customerName: customerName.trim(),
      notes: notes || undefined,
    };

    const result = activeOrderId 
      ? await updateOrder({ orderId: activeOrderId, ...orderData })
      : await createOrder(orderData);

    if (result.success) {
      clearCart();
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  }

  function handleClearCart() {
    clearCart();
    setShowClearConfirm(false);
  }

  const channelLabels: Record<OrderChannel, string> = {
    drive_thru: 'سيارة',
    dine_in: 'قاعة',
    delivery: 'توصيل',
  };

  const channelIcons: Record<OrderChannel, any> = {
    drive_thru: Car,
    dine_in: Utensils,
    delivery: Truck,
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
      {/* Edit Mode Banner */}
      {activeOrderId && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50" />
            <span className="text-xs sm:text-sm font-bold text-blue-800">
              تعديل الطلب النشط #{activeOrderId.slice(-6).toUpperCase()}
            </span>
          </div>
          <button
            onClick={cancelEdit}
            className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-200/50 rounded-lg"
            title="إلغاء التعديل">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-200 shrink-0 bg-white shadow-sm">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full shadow-sm" />
          تفاصيل الطلب
        </h2>
      </div>

      {/* A. Customer Name Field */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-100 shrink-0">
        <label className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-amber-500" />
          اسم العميل
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="أدخل اسم العميل"
            value={customerName}
            onChange={e => {
              setCustomerName(e.target.value);
              if (customerNameError) setCustomerNameError(null);
            }}
            className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm sm:text-base transition-all ${
              customerNameError ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-amber-300'
            }`}
          />
          {customerNameError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
        {customerNameError && (
          <p className="text-xs sm:text-sm text-red-600 mt-2 font-medium">{customerNameError}</p>
        )}
      </div>

      {/* B. Order Type Selector - Gold/Brown Theme */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-100 shrink-0">
        <label className="text-xs sm:text-sm font-semibold text-gray-600 mb-3 block">نوع الطلب</label>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-3">
          {(Object.keys(channelLabels) as OrderChannel[]).map(ch => {
            const Icon = channelIcons[ch];
            return (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl transition-all relative overflow-hidden ${
                  channel === ch
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-white text-gray-600 hover:bg-amber-50 border-2 border-gray-200 hover:border-amber-300'
                }`}>
                {channel === ch && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-amber-600/20 animate-pulse" />
                )}
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 relative z-10" />
                <span className="text-[10px] sm:text-xs lg:text-sm font-bold relative z-10">{channelLabels[ch]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* C. Order Notes */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-t border-gray-100 shrink-0">
        <label className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          ملاحظات الطلب
        </label>
        <textarea
          placeholder="أضف ملاحظات خاصة للطلب..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          maxLength={500}
          className="w-full min-h-[70px] sm:min-h-[80px] px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-white hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm sm:text-base resize-none transition-all"
        />
        <div className="text-xs text-gray-400 mt-1 text-left">
          {notes.length}/500
        </div>
      </div>

      {/* D. Bottom Action Bar */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 border-t border-gray-200 space-y-2 sm:space-y-3 lg:space-y-4 bg-gradient-to-b from-gray-50 to-white shrink-0 mt-auto shadow-sm">
        <div className="flex justify-between items-center p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl border border-amber-100">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-600">المجموع الفرعي</span>
            <p className="text-xs sm:text-sm lg:text-base font-bold text-gray-800">{subtotal().toFixed(2)} ل.س</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-600">الإجمالي</span>
            <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
              {subtotal().toFixed(2)} ل.س
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-[10px] sm:text-xs lg:text-sm text-red-600 text-center font-medium">{error}</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={items.length === 0 || isSubmitting}
          loading={isSubmitting}
          className={`w-full py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl text-white font-bold shadow-lg transition-all text-xs sm:text-sm lg:text-base lg:text-lg ${
            activeOrderId
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/30'
          }`}>
          {activeOrderId ? 'حفظ التعديلات' : 'إرسال الطلب'}
        </Button>

        {activeOrderId ? (
          <Button
            variant="ghost"
            onClick={cancelEdit}
            className="w-full py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold transition-colors text-xs sm:text-sm lg:text-base">
            إلغاء التعديل
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setShowClearConfirm(true)}
            disabled={items.length === 0}
            className="w-full py-2 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 font-bold transition-colors text-xs sm:text-sm lg:text-base">
            مسح الطلب
          </Button>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="تأكيد مسح السلة">
        <p className="text-gray-700 mb-4">هل أنت متأكد من مسح جميع الأصناف من السلة؟</p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowClearConfirm(false)}
            className="flex-1">
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={handleClearCart}
            className="flex-1">
            مسح
          </Button>
        </div>
      </Modal>
    </div>
  );
}
