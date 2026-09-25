import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function POST(request: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') {
    return NextResponse.json({ error: 'غير مصرح برفع الصور' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('image');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'يرجى اختيار صورة صالحة' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'يجب ألا يتجاوز حجم الصورة 5 ميغابايت' }, { status: 400 });
  }

  const extension = imageExtensions[file.type];
  if (!extension) {
    return NextResponse.json({ error: 'الصيغ المدعومة: JPG وPNG وWebP وGIF' }, { status: 400 });
  }

  const filename = `${randomUUID()}.${extension}`;
  const uploadDirectory = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ success: true, imageUrl: `/uploads/${filename}` });
}
