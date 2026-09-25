import { create } from 'zustand';
import type { Product, Category } from '@/types';

interface ProductsState {
  products:       Product[];
  categories:     Category[];
  activeCategory: string | null;
  setProducts:    (products: Product[]) => void;
  setCategories:  (categories: Category[]) => void;
  setActiveCategory: (id: string | null) => void;
  filteredProducts: () => Product[];
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products:       [],
  categories:     [],
  activeCategory: null,
  setProducts:    (products)   => set({ products }),
  setCategories:  (categories) => set({ categories }),
  setActiveCategory: (id)      => set({ activeCategory: id }),
  filteredProducts: () => {
    const { products, activeCategory } = get();
    if (!activeCategory) return products.filter(p => p.isAvailable);
    return products.filter(p => p.isAvailable && p.categoryId === activeCategory);
  },
}));
