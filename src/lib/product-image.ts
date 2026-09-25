export const DEFAULT_PRODUCT_IMAGE = '/images/default-food.svg';

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch('/api/uploads/product-image', { method: 'POST', body: formData });
  const result = await response.json();
  if (!response.ok || !result.imageUrl) {
    throw new Error(result.error || 'تعذر رفع الصورة');
  }
  return result.imageUrl;
}
