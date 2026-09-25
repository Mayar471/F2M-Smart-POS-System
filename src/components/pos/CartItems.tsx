'use client';
import { useCartStore } from '@/store/cart.store';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/product-image';

export function CartItems() {
  const { items, updateQty, removeItem } = useCartStore();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 border-b border-gray-200 shrink-0 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-5 sm:h-6 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full shadow-sm" />
            السلة
            {items.length > 0 && (
              <span className="ml-2 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-md">
                {items.length}
              </span>
            )}
          </h2>
          {items.length > 0 && (
            <button
              onClick={() => {
                items.forEach(item => removeItem(item.product.id));
              }}
              className="text-[10px] sm:text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
              مسح الكل
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8 sm:py-12 lg:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-inner">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-xs sm:text-sm lg:text-base font-semibold text-gray-500">السلة فارغة</p>
            <p className="text-[10px] sm:text-xs lg:text-sm mt-1 sm:mt-2 text-gray-400">أضف أصناف من القائمة للبدء</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {items.map(item => (
              <div key={item.product.id} className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all group relative overflow-hidden">
                {/* Background Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/0 via-amber-50/50 to-amber-50/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                {/* Thumbnail */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 overflow-hidden bg-amber-100 rounded-lg sm:rounded-xl lg:rounded-2xl shrink-0 shadow-inner relative z-10">
                  <img
                    src={item.product.imageUrl || DEFAULT_PRODUCT_IMAGE}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-xs sm:text-sm lg:text-base font-bold text-gray-900 truncate mb-0.5 sm:mb-1">{item.product.name}</p>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 font-medium">{item.unitPrice.toFixed(2)} ل.س</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0 relative z-10">
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-lg bg-white border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 text-gray-700 font-bold transition-all active:scale-95 shadow-sm text-sm sm:text-base">
                    −
                  </button>
                  <span className="w-6 sm:w-8 lg:w-10 text-center text-xs sm:text-sm lg:text-base font-bold text-gray-800 bg-gray-100 rounded-lg py-0.5 sm:py-1">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold transition-all active:scale-95 shadow-md shadow-amber-500/30 text-sm sm:text-base">
                    +
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-xs sm:text-sm lg:text-base font-bold text-gray-800 whitespace-nowrap w-14 sm:w-20 lg:w-24 text-left shrink-0 relative z-10">
                  <span className="bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                    {(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-[10px] sm:text-xs ml-1">ل.س</span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0 relative z-10"
                  title="إزالة">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
