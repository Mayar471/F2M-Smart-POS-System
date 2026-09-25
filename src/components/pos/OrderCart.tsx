'use client';
import { useEffect, useState, type ComponentType } from 'react';
import { useCartStore } from '@/store/cart.store';
import { createOrder, updateOrder } from '@/server/actions/order.actions';
import { getActiveShift } from '@/server/actions/shift.actions';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Truck, Utensils, Car, XCircle } from 'lucide-react';
import type { OrderChannel } from '@/types';
import { printOrderReceipts } from '@/lib/receipt-printer';

export function OrderCart({ onOrderSuccess }: { onOrderSuccess?: () => void }) {
  const { items, channel, notes, customerName, activeOrderId, orderNumber,
          setChannel, setNotes, setCustomerName,
          updateQty, clearCart, subtotal, cancelEdit, ensureOrderNumber } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerNameError, setCustomerNameError] = useState<string | null>(null);
  const displayedOrderNumber = orderNumber.replace(/\D/g, '') || '—';

  useEffect(() => {
    ensureOrderNumber();
  }, [ensureOrderNumber]);

  async function handleSubmit() {
    if (items.length === 0 || !orderNumber) return;
    
    // Validate customer name
    if (!customerName.trim()) {
      setCustomerNameError('اسم العميل مطلوب');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setCustomerNameError(null);

    const orderData = {
      orderNumber,
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
      // Get active shift for receipt
      const shiftResult = await getActiveShift();
      const shiftStartedAt = shiftResult.success && shiftResult.data 
        ? new Date(shiftResult.data.startedAt) 
        : undefined;

      // Print receipts for both new orders and edits
      const subtotalValue = subtotal();
      const receiptData = {
        orderNumber,
        customerName: customerName.trim(),
        channel,
        items: items.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
        })),
        subtotal: subtotalValue,
        totalAmount: subtotalValue,
        notes: notes || undefined,
        createdAt: new Date(),
        shiftStartedAt,
      };
      printOrderReceipts(receiptData);
      clearCart();
      onOrderSuccess?.();
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

  const channelIcons: Record<OrderChannel, ComponentType<{ className?: string }>> = {
    drive_thru: Car,
    dine_in: Utensils,
    delivery: Truck,
  };

  return (
    <div className="flex flex-col h-full bg-white" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(200px, 280px)', gridTemplateRows: 'auto auto auto minmax(0, 1fr) auto' }}>
      {/* Edit Mode Banner */}
      {activeOrderId && (
        <div className="col-span-full bg-blue-50 border-b border-blue-100 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between" style={{ gridRow: '1' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-blue-800">
              تعديل الطلب النشط #{activeOrderId.slice(-6).toUpperCase()}
            </span>
          </div>
          <button
            onClick={cancelEdit}
            className="text-blue-500 hover:text-blue-700 transition-colors p-1"
            title="إلغاء التعديل">
            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* Cart Header */}
      <div className="col-span-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 flex flex-col gap-1 sm:gap-1.5" style={{ gridRow: '2', background: '#1A1607', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="flex items-center justify-between">
          <span className="text-base sm:text-lg lg:text-xl font-medium" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#FFFFFF', letterSpacing: '0.3px' }}>الطلب الحالي</span>
          <span className="text-xs sm:text-sm" style={{ fontFamily: 'Outfit, monospace', color: '#A0906A', letterSpacing: '1px' }}>— #{displayedOrderNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-0.5 rounded-full" style={{ color: '#C9A84C', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)', letterSpacing: '0.3px' }}>
              {items.length} {items.length === 1 ? 'صنف' : 'أصناف'}
            </span>
          )}
        </div>
      </div>

      {/* Order Meta Fields */}
      <div className="col-span-2 px-2.5 sm:px-4 py-2 sm:py-3.5 flex flex-col gap-1.5 sm:gap-2.5" style={{ gridRow: '3', gridColumn: '2 / 3', borderBottom: '1.5px solid #DDD4B6', background: '#EDE7D8' }}>
        <div className="flex flex-col gap-1.5 sm:gap-2.5">
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label className="text-xs sm:text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif', color: '#6B5E3A', letterSpacing: '0.5px' }}>اسم العميل</label>
            <input
              type="text"
              placeholder="صاحب الطلب…"
              value={customerName}
              onChange={e => {
                setCustomerName(e.target.value);
                if (customerNameError) setCustomerNameError(null);
              }}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium outline-none transition-all resize-none"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #DDD4B6',
                color: '#1C1810',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif'
              }}
            />
            {customerNameError && (
              <p className="text-xs text-red-600">{customerNameError}</p>
            )}
          </div>
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <label className="text-xs sm:text-sm font-semibold" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif', color: '#6B5E3A', letterSpacing: '0.5px' }}>ملاحظات الطلب</label>
            <input
              type="text"
              placeholder="مثال: بدون بصل…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={100}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium outline-none transition-all resize-none"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #DDD4B6',
                color: '#1C1810',
                fontFamily: 'IBM Plex Sans Arabic, sans-serif'
              }}
            />
          </div>
        </div>
      </div>

      {/* Order Type Selector */}
      <div className="col-span-2 px-2.5 sm:px-4 py-2 sm:py-4" style={{ gridRow: '3', gridColumn: '1 / 2', borderBottom: '1.5px solid #DDD4B6' }}>
        <label className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 block" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif', color: '#6B5E3A' }}>نوع الطلب</label>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {(Object.keys(channelLabels) as OrderChannel[]).map(ch => {
            const Icon = channelIcons[ch];
            return (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${
                  channel === ch
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
                style={{
                  background: channel === ch ? 'linear-gradient(135deg, #D4B45A 0%, #8B6914 100%)' : '#FFFFFF',
                  boxShadow: channel === ch ? '0 6px 24px rgba(201,168,76,0.4)' : 'none'
                }}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-bold">{channelLabels[ch]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="col-span-full overflow-y-auto px-2 sm:px-3 py-2 sm:py-3 flex flex-col gap-1.5 sm:gap-1.75" style={{ gridRow: '4', gridColumn: '1 / 3' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 sm:gap-2.5 py-8 sm:py-12" style={{ color: '#A0906A' }}>
            <div className="opacity-60">
              <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="27.5" stroke="#C9A84C" strokeOpacity="0.2"/>
                <path d="M16 20h24l-3 14H19L16 20z" stroke="#C9A84C" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
                <circle cx="22" cy="38" r="2" fill="#C9A84C" fillOpacity="0.5"/>
                <circle cx="34" cy="38" r="2" fill="#C9A84C" fillOpacity="0.5"/>
                <path d="M13 17h4" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-base sm:text-xl italic font-semibold" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>لا توجد أصناف بعد</p>
            <p className="text-xs sm:text-sm">اختر من القائمة للإضافة</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 sm:gap-1.75">
            {items.map(item => (
              <div key={item.product.id} className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-2.75 py-1.5 sm:py-2.5 rounded-lg border transition-all" style={{
                background: '#F2EDE2',
                borderColor: '#DDD4B6'
              }}>
                {/* Thumbnail */}
                <div className="w-7 h-7 sm:w-9.5 sm:h-9.5 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F6F0DC' }}>
                  <span className="text-xs sm:text-sm font-bold" style={{ color: '#8B6914' }}>
                    {item.product.name.charAt(0)}
                  </span>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate" style={{ color: '#1C1810' }}>{item.product.name}</p>
                  <p className="text-xs" style={{ color: '#A0906A' }}>{item.unitPrice.toFixed(2)} ل.س / القطعة</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 sm:gap-1.75 shrink-0">
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity - 1)}
                    className="w-5 h-5 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center transition-all text-sm sm:text-base font-medium"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #DDD4B6',
                      color: '#6B5E3A'
                    }}>
                    −
                  </button>
                  <span className="w-3.5 sm:w-4.5 text-center text-xs sm:text-sm font-bold" style={{ color: '#1C1810', fontFamily: 'Outfit, monospace' }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity + 1)}
                    className="w-5 h-5 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center transition-all text-sm sm:text-base font-medium"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #DDD4B6',
                      color: '#6B5E3A'
                    }}>
                    +
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-xs sm:text-sm font-bold whitespace-nowrap w-8 sm:w-10 text-left shrink-0" style={{ color: '#8B6914', fontFamily: 'Outfit, monospace' }}>
                  {(item.unitPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="col-span-full px-2.5 sm:px-4 py-2 sm:py-3.5 flex flex-col gap-2 sm:gap-3" style={{ gridRow: '5', gridColumn: '1 / 3', borderTop: '1px solid #DDD4B6', background: '#FFFFFF' }}>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm sm:text-base" style={{ color: '#A0906A' }}>الإجمالي</span>
            <span className="text-lg sm:text-2xl font-bold" style={{ fontFamily: 'Outfit, monospace', color: '#8B6914', letterSpacing: '0.5px' }}>
              {subtotal().toFixed(2)} ل.س
            </span>
          </div>
        </div>

        {error && (
          <div className="p-1.5 sm:p-2 rounded-lg" style={{ background: '#FEE8E7', border: '1px solid #C84B3F' }}>
            <p className="text-xs text-red-600 text-center font-medium">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <button
            onClick={handleSubmit}
            disabled={items.length === 0 || isSubmitting}
            className="w-full py-2 sm:py-3 rounded-lg sm:rounded-xl text-white font-bold transition-all text-sm sm:text-base"
            style={{
              background: 'linear-gradient(135deg, #D4B45A 0%, #8B6914 100%)',
              boxShadow: '0 6px 24px rgba(201,168,76,0.4)',
              letterSpacing: '0.5px',
              fontFamily: 'IBM Plex Sans Arabic, sans-serif'
            }}>
            {activeOrderId ? 'حفظ التعديلات' : 'إتمام الطلب'}
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={items.length === 0}
            className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-medium"
            style={{
              border: '1.5px solid #DDD4B6',
              background: 'transparent',
              color: '#A0906A',
              letterSpacing: '0.2px'
            }}>
            مسح الطلب
          </button>
        </div>
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
