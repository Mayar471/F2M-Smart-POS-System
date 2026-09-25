'use client';
import { useEffect } from 'react';
import type { Product } from '@/types';
import { getProducts, getCategories } from '@/server/actions/product.actions';
import { useProductsStore } from '@/store/products.store';
import { useCartStore } from '@/store/cart.store';
import { Plus } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/product-image';

export function ProductGrid({ searchQuery }: { searchQuery: string }) {
  const { categories, activeCategory, setProducts, setCategories, setActiveCategory, filteredProducts } = useProductsStore();
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    async function load() {
      const [pRes, cRes] = await Promise.all([getProducts(), getCategories()]);
      if (pRes.success) setProducts(pRes.data);
      if (cRes.success) {
        setCategories(cRes.data);
        // Set first category as active by default
        if (cRes.data.length > 0) {
          setActiveCategory(cRes.data[0].id);
        }
      }
    }
    load();
  }, [setProducts, setCategories, setActiveCategory]);

  const displayed = filteredProducts().filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !p.isDeleted &&
    p.isAvailable
  );

  return (
    <div className="flex flex-col h-full">
      {/* Category Tabs - Prototype Style */}
      <nav className="flex gap-1.5 sm:gap-2.5 shrink-0 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all shrink-0
              ${activeCategory === cat.id
                ? 'text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-700'}`}
            style={{
              border: '1.5px solid #DDD4B6',
              background: activeCategory === cat.id ? 'linear-gradient(135deg, #D4B45A 0%, #8B6914 100%)' : '#FFFFFF',
              boxShadow: activeCategory === cat.id ? '0 6px 24px rgba(201,168,76,0.4)' : '0 1px 4px rgba(139,105,20,0.08)'
            }}>
            <span className="text-xs sm:text-base font-semibold" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>{cat.name}</span>
            <span className="text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full" style={{
              background: activeCategory === cat.id ? 'rgba(255,255,255,0.2)' : '#F6F0DC',
              color: activeCategory === cat.id ? '#FFFFFF' : '#8B6914',
              fontFamily: 'Outfit, monospace'
            }}>
              {displayed.filter(p => p.categoryId === cat.id).length}
            </span>
          </button>
        ))}
      </nav>

      {/* Product Grid - Prototype Style */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C9A84C #F6F0DC', paddingLeft: '2px' }}>
        <div className="grid gap-2 sm:gap-3 md:gap-4 pb-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {displayed.map(product => (
            <ProductCard key={product.id} product={product} onTap={addItem} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onTap }: { product: Product; onTap: (p: Product) => void }) {
  return (
    <button
      onClick={() => onTap(product)}
      disabled={!product.isAvailable}
      className={`relative flex flex-col rounded-lg sm:rounded-xl overflow-hidden transition-all cursor-pointer
        ${product.isAvailable ? 'hover:transform hover:-translate-y-0.5 sm:hover:-translate-y-1.25' : 'opacity-50 cursor-not-allowed'}`}
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #DDD4B6',
        boxShadow: '0 1px 4px rgba(139,105,20,0.08)'
      }}>
      {/* Product image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 3', background: '#F6F0DC' }}>
        <img
          src={product.imageUrl || DEFAULT_PRODUCT_IMAGE}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
          }}
        />
      </div>

      {/* Product Info */}
      <div className="flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-3.5">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-xs sm:text-base font-semibold flex-1 leading-tight" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif', color: '#1C1810', wordBreak: 'break-word', whiteSpace: 'normal' }}>{product.name}</h3>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shrink-0" style={{
            background: '#F6F0DC',
            border: '1.5px solid rgba(201,168,76,0.30)',
            color: '#8B6914'
          }}>
            <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-bold" style={{ fontFamily: 'Outfit, monospace', color: '#8B6914', fontSize: '14px sm:21px', letterSpacing: '0.3px' }}>
            {product.price.toFixed(2)}
            <span className="text-xs font-normal ml-1" style={{ color: '#A0906A' }}>ل.س</span>
          </div>
        </div>
      </div>
    </button>
  );
}
