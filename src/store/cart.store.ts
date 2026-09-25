import { create } from 'zustand';
import type { CartItem, Product, OrderChannel } from '@/types';

const createOrderNumber = () => `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

interface CartState {
  items:       CartItem[];
  channel:     OrderChannel;
  notes:       string;
  cashReceived: number | null;
  customerName: string;
  activeOrderId: string | null;
  orderNumber: string;
  ensureOrderNumber: () => void;
  addItem:     (product: Product) => void;
  removeItem:  (productId: string) => void;
  updateQty:   (productId: string, quantity: number) => void;
  setChannel:  (channel: OrderChannel) => void;
  setNotes:    (notes: string) => void;
  setCustomerName: (customerName: string) => void;
  setCashReceived: (amount: number | null) => void;
  clearCart:   () => void;
  loadOrder:   (orderId: string, customerName: string, channel: OrderChannel, notes: string, items: CartItem[]) => void;
  cancelEdit:  () => void;
  // Computed
  subtotal:    () => number;
  changeAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items:        [],
  channel:      'dine_in',
  notes:        '',
  cashReceived: null,
  customerName: '',
  activeOrderId: null,
  // Keep this deterministic during SSR; it is generated after hydration.
  orderNumber: '',

  ensureOrderNumber: () => set((state) =>
    state.activeOrderId || state.orderNumber ? {} : { orderNumber: createOrderNumber() }
  ),

  addItem: (product) => set((state) => {
    const existing = state.items.find(i => i.product.id === product.id);
    if (existing) {
      return { items: state.items.map(i =>
        i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )};
    }
    return { items: [...state.items, { product, quantity: 1, unitPrice: product.price }] };
  }),

  removeItem: (productId) => set((state) => ({
    items: state.items.filter(i => i.product.id !== productId),
  })),

  updateQty: (productId, quantity) => set((state) => ({
    items: quantity <= 0
      ? state.items.filter(i => i.product.id !== productId)
      : state.items.map(i =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
  })),

  setChannel:      (channel)      => set({ channel }),
  setNotes:        (notes)        => set({ notes }),
  setCustomerName: (customerName) => set({ customerName }),
  setCashReceived: (cashReceived) => set({ cashReceived }),
  clearCart: () => set({ items: [], notes: '', cashReceived: null, customerName: '', activeOrderId: null, orderNumber: createOrderNumber() }),
  
  loadOrder: (orderId, customerName, channel, notes, items) => set({
    activeOrderId: orderId,
    orderNumber: orderId,
    customerName,
    channel,
    notes,
    items,
  }),

  cancelEdit: () => set({
    activeOrderId: null,
    orderNumber: createOrderNumber(),
    customerName: '',
    channel: 'dine_in',
    notes: '',
    items: [],
    cashReceived: null,
  }),

  subtotal: () => get().items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
  changeAmount: () => {
    const { cashReceived, subtotal } = get();
    if (cashReceived === null) return 0;
    return Math.max(0, cashReceived - subtotal());
  },
}));
