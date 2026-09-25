'use client';
import { useState, useEffect } from 'react';
import { createProduct, getCategories } from '@/server/actions/product.actions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Category } from '@/types';
import { Upload, X } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE, uploadProductImage } from '@/lib/product-image';

interface MenuItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MenuItemForm({ isOpen, onClose, onSuccess }: MenuItemFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    price: '',
    isAvailable: true,
  });

  async function loadCategories() {
    const result = await getCategories();
    if (result.success) {
      setCategories(result.data);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setError(null);
      setFormData({ categoryId: '', name: '', price: '', isAvailable: true });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  function getDefaultImage(categoryName: string): string {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('burger') || lowerName.includes('برجر')) {
      return '/images/default-burger.png';
    } else if (lowerName.includes('pizza') || lowerName.includes('بيتزا')) {
      return '/images/default-pizza.png';
    } else if (lowerName.includes('drink') || lowerName.includes('مشروب') || lowerName.includes('beverage')) {
      return '/images/default-drink.png';
    } else if (lowerName.includes('fries') || lowerName.includes('بطاطس')) {
      return '/images/default-fries.png';
    } else if (lowerName.includes('dessert') || lowerName.includes('حلويات')) {
      return '/images/default-dessert.png';
    }
    return '/images/default-food.png';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let imageUrl: string | undefined;
    
    try {
      imageUrl = imageFile ? await uploadProductImage(imageFile) : DEFAULT_PRODUCT_IMAGE;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'تعذر رفع الصورة');
      setLoading(false);
      return;
    }

    const result = await createProduct({
      categoryId: formData.categoryId,
      name: formData.name,
      price: parseFloat(formData.price),
      isAvailable: formData.isAvailable,
      imageUrl,
    });

    if (result.success) {
      onClose();
      onSuccess();
    } else {
      setError(result.error);
    }

    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إضافة منتج جديد">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
          <select
            value={formData.categoryId}
            onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
            required
            className="w-full min-h-[48px] px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]">
            <option value="">اختر التصنيف</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <Input
          label="اسم المنتج"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="السعر"
          type="text"
          inputMode="decimal"
          value={formData.price}
          onChange={e => setFormData({ ...formData, price: e.target.value })}
          required
        />

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">صورة المنتج</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">اضغط لرفع صورة</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                  اختر صورة
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  أو سيتم استخدام صورة افتراضية حسب التصنيف
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
          />
          <label htmlFor="isAvailable" className="text-sm text-gray-700">متوفر</label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            إلغاء
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="flex-1">
            إضافة
          </Button>
        </div>
      </form>
    </Modal>
  );
}
