import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../cart.store';

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  const createProduct = (id: string, name: string, price: number) => ({
    id,
    name,
    nameAr: name,
    price,
    categoryId: 'cat1',
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('starts with empty cart', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.subtotal()).toBe(0);
  });

  it('adds item to cart', () => {
    const product = createProduct('1', 'Test Product', 10);
    
    useCartStore.getState().addItem(product);
    
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product).toEqual(product);
    expect(state.items[0].quantity).toBe(1);
  });

  it('increments quantity for existing item', () => {
    const product = createProduct('1', 'Test Product', 10);
    
    useCartStore.getState().addItem(product);
    useCartStore.getState().addItem(product);
    
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('removes item from cart', () => {
    const product = createProduct('1', 'Test Product', 10);
    
    useCartStore.getState().addItem(product);
    useCartStore.getState().removeItem('1');
    
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
  });

  it('calculates subtotal correctly', () => {
    const product1 = createProduct('1', 'Test Product 1', 10);
    const product2 = createProduct('2', 'Test Product 2', 20);
    
    useCartStore.getState().addItem(product1);
    useCartStore.getState().addItem(product2);
    useCartStore.getState().addItem(product1);
    
    const state = useCartStore.getState();
    expect(state.subtotal()).toBe(40); // 10*2 + 20*1
  });

  it('calculates change amount correctly', () => {
    const product = createProduct('1', 'Test Product', 10);
    
    useCartStore.getState().addItem(product);
    useCartStore.getState().setCashReceived(15);
    
    const state = useCartStore.getState();
    expect(state.changeAmount()).toBe(5);
  });

  it('clears cart', () => {
    const product = createProduct('1', 'Test Product', 10);
    
    useCartStore.getState().addItem(product);
    useCartStore.getState().clearCart();
    
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.cashReceived).toBeNull();
    expect(state.notes).toBe('');
  });
});
