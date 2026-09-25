'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportChartProps {
  data: { productId: string; productName: string; quantity: number; revenue: number }[];
}

export function ReportChart({ data }: ReportChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        لا توجد بيانات للعرض
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: any) => [
            value?.toLocaleString?.() ?? value,
            'الكمية',
          ]}
          labelFormatter={(label) => `المنتج: ${label}`}
        />
        <Bar dataKey="quantity" fill="var(--brand-primary)" name="الكمية" />
      </BarChart>
    </ResponsiveContainer>
  );
}
