'use client';
import { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { MenuItemForm } from '@/components/manager/MenuItemForm';
import { getProducts, getCategories, createCategory, deleteCategory, updateProduct, deleteProduct, toggleProductAvailability, restoreProduct } from '@/server/actions/product.actions';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { signOut } from 'next-auth/react';
import { Trash2, ArrowLeft, RotateCcw, Upload, X, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DEFAULT_PRODUCT_IMAGE, uploadProductImage } from '@/lib/product-image';

export default function ManagerMenuPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const managerName = user?.name || 'المدير';
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', categoryId: '', price: '', isAvailable: true, imageUrl: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const defaultProductImage = DEFAULT_PRODUCT_IMAGE;
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Format current date in Arabic
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  async function loadProducts() {
    setLoading(true);
    const result = await getProducts(activeTab === 'deleted');
    if (result.success) {
      setProducts(result.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  async function loadCategories() {
    const result = await getCategories();
    if (result.success) setCategories(result.data);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleCreateCategory() {
    const result = await createCategory({ name: newCategoryName });
    if (result.success) {
      setNewCategoryName('');
      setCategoryError(null);
      loadCategories();
    } else {
      setCategoryError(result.error);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    const result = await deleteCategory({ id: categoryId });
    if (result.success) {
      setCategoryError(null);
      loadCategories();
    } else {
      setCategoryError(result.error);
    }
  }

  async function handleToggleAvailability(productId: string, currentStatus: boolean) {
    const result = await toggleProductAvailability({
      id: productId,
      isAvailable: !currentStatus,
    });
    if (result.success) {
      loadProducts();
    }
  }

  async function handleFullEdit(productId: string) {
    let imageUrl = editForm.imageUrl;
    
    if (editImageFile) {
      try {
        imageUrl = await uploadProductImage(editImageFile);
      } catch (uploadError) {
        setEditError(uploadError instanceof Error ? uploadError.message : 'تعذر رفع الصورة');
        return;
      }
    }

    const result = await updateProduct({
      id: productId,
      name: editForm.name,
      categoryId: editForm.categoryId,
      price: parseFloat(editForm.price),
      isAvailable: editForm.isAvailable,
      imageUrl,
    });
    if (result.success) {
      // Update local state with returned product
      setProducts(products.map(p => p.id === productId ? result.data : p));
      setEditingProduct(null);
      setEditForm({ name: '', categoryId: '', price: '', isAvailable: true, imageUrl: '' });
      setEditImageFile(null);
      setEditImagePreview(null);
      setEditError(null);
    } else {
      setEditError(result.error);
    }
  }

  async function handleDelete(productId: string) {
    const result = await deleteProduct({ id: productId });
    if (result.success) {
      setProducts(products.filter(p => p.id !== productId));
      setDeleteConfirm(null);
      setDeleteError(null);
    } else {
      setDeleteError(result.error);
    }
  }

  function startEdit(product: any) {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price.toString(),
      isAvailable: product.isAvailable,
      imageUrl: product.imageUrl || '',
    });
    setEditImagePreview(product.imageUrl || null);
    setEditImageFile(null);
    setEditError(null);
  }

  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveEditImage() {
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditForm({ ...editForm, imageUrl: '' });
  }

  async function handleRestore(productId: string) {
    const result = await restoreProduct({ id: productId });
    if (result.success) {
      loadProducts();
    }
  }

  function handleBackToDashboard() {
    router.push('/manager/dashboard');
  }

  function handleLogout() {
    router.push('/logout');
  }

  return (
    <RoleGuard allowedRole="manager">
      <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#F2EDE2' }}>
        {/* Header - POS Style */}
        <header className="shrink-0 px-4 sm:px-6 lg:px-7 flex items-center justify-between gap-4" style={{ height: '68px', minHeight: '68px', backgroundColor: '#0F0C03', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
          {/* Left Section */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:block">الخلف</span>
            </button>
            <div className="w-px h-6 sm:h-8 mx-2 shrink-0" style={{ background: 'rgba(201,168,76,0.25)' }}></div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base sm:text-lg font-semibold" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif', color: '#C9A84C', lineHeight: 1 }}>إدارة القائمة</span>
            </div>
          </div>

          {/* Center Info */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="text-lg sm:text-xl font-semibold" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif', color: '#C9A84C', lineHeight: 1 }}>{managerName}</div>
            <div className="text-xs sm:text-sm hidden sm:block" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#A0906A', letterSpacing: '0.5px' }}>{currentDate}</div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10 shrink-0">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:block">تسجيل الخروج</span>
          </button>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-6 py-3 rounded-xl font-medium transition-all min-h-[48px]
                  ${activeTab === 'active'
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-gray-50'}`}
                style={activeTab === 'active' ? { background: 'linear-gradient(135deg, #D4B45A 0%, #8B6914 100%)' } : { background: '#F6F0DC', border: '1.5px solid #DDD4B6' }}>
                المنتجات النشطة
              </button>
              <button
                onClick={() => setActiveTab('deleted')}
                className={`px-6 py-3 rounded-xl font-medium transition-all min-h-[48px]
                  ${activeTab === 'deleted'
                    ? 'text-white'
                    : 'text-gray-700 hover:bg-gray-50'}`}
                style={activeTab === 'deleted' ? { background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' } : { background: '#F6F0DC', border: '1.5px solid #DDD4B6' }}>
                سلة المحذوفات
              </button>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
                {activeTab === 'active' ? 'المنتجات' : 'المنتجات المحذوفة'} ({products.length})
              </h2>
              {activeTab === 'active' && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="min-h-[48px] px-6"
                  style={{ background: 'linear-gradient(135deg, #D4B45A 0%, #8B6914 100%)' }}>
                  + إضافة منتج
                </Button>
              )}
            </div>

            {activeTab === 'active' && (
              <section className="bg-white rounded-2xl border-2 border-gray-200 p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 mb-3">إدارة الفئات</h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <Input
                    value={newCategoryName}
                    onChange={event => {
                      setNewCategoryName(event.target.value);
                      if (categoryError) setCategoryError(null);
                    }}
                    placeholder="اسم الفئة الجديدة"
                    className="flex-1"
                  />
                  <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                    إضافة فئة
                  </Button>
                </div>
                {categoryError && <p className="text-sm text-red-600 mb-3">{categoryError}</p>}
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <div key={category.id} className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm text-gray-800">
                      <span>{category.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={`حذف فئة ${category.name}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {loading ? (
            <div className="text-center text-gray-400 py-8">جاري التحميل...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-400 py-8">لا توجد منتجات</div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الصورة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الاسم</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">السعر</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 overflow-hidden rounded-lg border border-gray-200 bg-amber-50">
                          <img
                            src={product.imageUrl || defaultProductImage}
                            alt={`صورة ${product.name}`}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = defaultProductImage;
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-[var(--brand-primary)]">
                          {Number(product.price).toFixed(2)} ل.س
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={product.isAvailable ? 'success' : 'danger'}>
                          {product.isAvailable ? 'متوفر' : 'غير متوفر'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {activeTab === 'active' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(product)}>
                                تعديل
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setDeleteConfirm(product.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAvailability(product.id, product.isAvailable)}>
                                {product.isAvailable ? 'غير متوفر حالياً' : 'متوفر'}
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleRestore(product.id)}>
                              <RotateCcw className="w-4 h-4 ml-1" />
                              استعادة
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <MenuItemForm
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadProducts}
        />

        {/* Full Edit Modal */}
        <Modal
          isOpen={editingProduct !== null}
          onClose={() => {
            setEditingProduct(null);
            setEditError(null);
            setEditImageFile(null);
            setEditImagePreview(null);
          }}
          title="تعديل المنتج">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {editError && (
              <p className="text-sm text-red-600">{editError}</p>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">الاسم</label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">السعر</label>
              <Input
                type="text"
                inputMode="decimal"
                value={editForm.price}
                onChange={e => setEditForm({ ...editForm, price: e.target.value })}
              />
            </div>
            
            {/* Image Upload in Edit Modal */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">صورة المنتج</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                {editImagePreview ? (
                  <div className="relative">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveEditImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">اضغط لرفع صورة جديدة</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label
                      htmlFor="edit-image-upload"
                      className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
                      اختر صورة
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.isAvailable}
                onChange={e => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-700">متوفر</label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingProduct(null);
                  setEditError(null);
                  setEditImageFile(null);
                  setEditImagePreview(null);
                }}
                className="flex-1">
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={() => editingProduct && handleFullEdit(editingProduct)}
                className="flex-1">
                حفظ
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteConfirm !== null}
          onClose={() => {
            setDeleteConfirm(null);
            setDeleteError(null);
          }}
          title="تأكيد حذف المنتج">
          <div className="space-y-4">
            {deleteError && (
              <p className="text-sm text-red-600">{deleteError}</p>
            )}
            <p className="text-gray-700">
              هل أنت متأكد من حذف المنتج "{products.find(p => p.id === deleteConfirm)?.name}"؟
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteError(null);
                }}
                className="flex-1">
                إلغاء
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="flex-1">
                حذف
              </Button>
            </div>
          </div>
        </Modal>
        </div>
      </div>
    </RoleGuard>
  );
}
