// src/lib/receipt-printer.ts
// Receipt printing utility for POS system

export interface ReceiptData {
  orderNumber: string;
  customerName: string;
  channel: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  totalAmount: number;
  cashReceived?: number;
  changeAmount?: number;
  notes?: string;
  createdAt: Date;
  shiftStartedAt?: Date;
}

export function printReceipt(data: ReceiptData, copy: 'kitchen' | 'customer' = 'customer'): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('تعذر فتح نافذة الطباعة. يرجى السماح للنوافذ المنبثقة.');
    return;
  }

  const channelLabels: Record<string, string> = {
    drive_thru: 'سيارة',
    dine_in: 'قاعة',
    delivery: 'توصيل',
  };

  const channelLabel = channelLabels[data.channel] || data.channel;
  const dateStr = data.createdAt.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = data.createdAt.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const orderDateTime = data.createdAt.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate shift elapsed time if shift data is available
  let shiftElapsedStr = '';
  if (data.shiftStartedAt) {
    const elapsedSeconds = Math.floor((data.createdAt.getTime() - data.shiftStartedAt.getTime()) / 1000);
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const formatNumber = (num: number) => 
      num.toLocaleString('ar-SA', { minimumIntegerDigits: 2, useGrouping: false });
    shiftElapsedStr = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
  }

  const receiptHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة ${copy === 'kitchen' ? 'مطبخ' : 'عميل'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 10px;
          width: 80mm;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .store-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .store-info {
          font-size: 10px;
          color: #333;
        }
        .order-info {
          margin-bottom: 15px;
          padding: 5px 0;
          border-bottom: 1px dashed #000;
        }
        .order-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .items-table {
          width: 100%;
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .items-table th {
          text-align: right;
          border-bottom: 1px solid #000;
          padding: 3px 0;
          font-size: 10px;
        }
        .items-table td {
          padding: 3px 0;
        }
        .item-name {
          text-align: right;
        }
        .item-qty {
          text-align: center;
        }
        .item-price {
          text-align: left;
        }
        .totals {
          margin-bottom: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .total-row.final {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
        .copy-label {
          text-align: center;
          font-weight: bold;
          margin-bottom: 10px;
          padding: 5px;
          background: #f0f0f0;
          border: 1px solid #000;
        }
        .notes {
          margin-top: 10px;
          padding: 5px;
          border: 1px dashed #000;
          font-size: 10px;
        }
        @media print {
          body {
            width: 80mm;
            margin: 0;
            padding: 5px;
          }
          .receipt-container, .header, .order-info, .items-table, .totals, .footer, .copy-label, .notes {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-container *, .header *, .order-info *, .items-table *, .totals *, .footer *, .copy-label *, .notes * {
            font-weight: 700 !important;
            color: #000000 !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="copy-label">${copy === 'kitchen' ? 'نسخة المطبخ' : 'نسخة العميل'}</div>
      
      <div class="header">
        <div class="store-name">F2M BURGER</div>
        <div class="store-info">مدينة النبك</div>
        <div class="store-info">نظام نقاط البيع الذكي</div>
      </div>

      <div class="order-info">
        <div class="order-info-row">
          <span>رقم الطلب:</span>
          <span>${data.orderNumber}</span>
        </div>
        <div class="order-info-row">
          <span>وقت الطلب:</span>
          <span>${orderDateTime}</span>
        </div>
        ${shiftElapsedStr ? `
        <div class="order-info-row">
          <span>وقت الوردية:</span>
          <span>${shiftElapsedStr}</span>
        </div>
        ` : ''}
        <div class="order-info-row">
          <span>القناة:</span>
          <span>${channelLabel}</span>
        </div>
        ${data.customerName ? `
        <div class="order-info-row">
          <span>العميل:</span>
          <span>${data.customerName}</span>
        </div>
        ` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="item-name">الصنف</th>
            <th class="item-qty">الكمية</th>
            <th class="item-price">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td class="item-name">${item.name}</td>
              <td class="item-qty">${item.quantity}</td>
              <td class="item-price">${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>المجموع:</span>
          <span>${data.subtotal.toFixed(2)} ل.س</span>
        </div>
        <div class="total-row final">
          <span>الإجمالي:</span>
          <span>${data.totalAmount.toFixed(2)} ل.س</span>
        </div>
        ${data.cashReceived ? `
        <div class="total-row">
          <span>المبلغ المستلم:</span>
          <span>${data.cashReceived.toFixed(2)} ل.س</span>
        </div>
        ` : ''}
        ${data.changeAmount !== undefined ? `
        <div class="total-row">
          <span>الباقي:</span>
          <span>${data.changeAmount.toFixed(2)} ل.س</span>
        </div>
        ` : ''}
      </div>

      ${data.notes ? `
      <div class="notes">
        <strong>ملاحظات:</strong> ${data.notes}
      </div>
      ` : ''}

      <div class="footer">
        <div>شكراً لتعاملكم معنا</div>
        <div>F2M BURGER</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}

export function printOrderReceipts(data: ReceiptData): void {
  // Print both copies on a single page to avoid popup blocking
  printDualReceipt(data);
}

function printDualReceipt(data: ReceiptData): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('تعذر فتح نافذة الطباعة. يرجى السماح للنوافذ المنبثقة.');
    return;
  }

  const channelLabels: Record<string, string> = {
    drive_thru: 'سيارة',
    dine_in: 'قاعة',
    delivery: 'توصيل',
  };

  const channelLabel = channelLabels[data.channel] || data.channel;
  const dateStr = data.createdAt.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = data.createdAt.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const orderDateTime = data.createdAt.toLocaleString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate shift elapsed time if shift data is available
  let shiftElapsedStr = '';
  if (data.shiftStartedAt) {
    const elapsedSeconds = Math.floor((data.createdAt.getTime() - data.shiftStartedAt.getTime()) / 1000);
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    const formatNumber = (num: number) => 
      num.toLocaleString('ar-SA', { minimumIntegerDigits: 2, useGrouping: false });
    shiftElapsedStr = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
  }

  const generateReceiptHTML = (copy: 'kitchen' | 'customer') => `
    <div class="receipt-container" style="page-break-after: ${copy === 'kitchen' ? 'always' : 'auto'}; margin-bottom: ${copy === 'kitchen' ? '20px' : '0'};">
      <div class="copy-label">${copy === 'kitchen' ? 'نسخة المطبخ' : 'نسخة العميل'}</div>
      
      <div class="header">
        <div class="store-name">F2M BURGER</div>
        <div class="store-info">مدينة النبك</div>
        <div class="store-info">نظام نقاط البيع الذكي</div>
      </div>

      <div class="order-info">
        <div class="order-info-row">
          <span>رقم الطلب:</span>
          <span>${data.orderNumber}</span>
        </div>
        <div class="order-info-row">
          <span>وقت الطلب:</span>
          <span>${orderDateTime}</span>
        </div>
        ${shiftElapsedStr ? `
        <div class="order-info-row">
          <span>وقت الوردية:</span>
          <span>${shiftElapsedStr}</span>
        </div>
        ` : ''}
        <div class="order-info-row">
          <span>القناة:</span>
          <span>${channelLabel}</span>
        </div>
        ${data.customerName ? `
        <div class="order-info-row">
          <span>العميل:</span>
          <span>${data.customerName}</span>
        </div>
        ` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="item-name">الصنف</th>
            <th class="item-qty">الكمية</th>
            <th class="item-price">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td class="item-name">${item.name}</td>
              <td class="item-qty">${item.quantity}</td>
              <td class="item-price">${item.totalPrice.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>المجموع:</span>
          <span>${data.subtotal.toFixed(2)} ل.س</span>
        </div>
        <div class="total-row final">
          <span>الإجمالي:</span>
          <span>${data.totalAmount.toFixed(2)} ل.س</span>
        </div>
        ${data.cashReceived ? `
        <div class="total-row">
          <span>المبلغ المستلم:</span>
          <span>${data.cashReceived.toFixed(2)} ل.س</span>
        </div>
        ` : ''}
        ${data.changeAmount !== undefined ? `
        <div class="total-row">
          <span>الباقي:</span>
          <span>${data.changeAmount.toFixed(2)} ل.س</span>
        </div>
        ` : ''}
      </div>

      ${data.notes ? `
      <div class="notes">
        <strong>ملاحظات:</strong> ${data.notes}
      </div>
      ` : ''}

      <div class="footer">
        <div>شكراً لتعاملكم معنا</div>
        <div>F2M BURGER</div>
      </div>
    </div>
  `;

  const receiptHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>فاتورة الطلب</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 10px;
          width: 80mm;
          background: white;
        }
        .receipt-container {
          margin-bottom: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .store-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .store-info {
          font-size: 10px;
          color: #333;
        }
        .order-info {
          margin-bottom: 15px;
          padding: 5px 0;
          border-bottom: 1px dashed #000;
        }
        .order-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .items-table {
          width: 100%;
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .items-table th {
          text-align: right;
          border-bottom: 1px solid #000;
          padding: 3px 0;
          font-size: 10px;
        }
        .items-table td {
          padding: 3px 0;
        }
        .item-name {
          text-align: right;
        }
        .item-qty {
          text-align: center;
        }
        .item-price {
          text-align: left;
        }
        .totals {
          margin-bottom: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .total-row.final {
          font-weight: bold;
          font-size: 14px;
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
        .copy-label {
          text-align: center;
          font-weight: bold;
          margin-bottom: 10px;
          padding: 5px;
          background: #f0f0f0;
          border: 1px solid #000;
        }
        .notes {
          margin-top: 10px;
          padding: 5px;
          border: 1px dashed #000;
          font-size: 10px;
        }
        @media print {
          body {
            width: 80mm;
            margin: 0;
            padding: 5px;
          }
          .receipt-container {
            page-break-after: always;
          }
          .receipt-container:last-child {
            page-break-after: auto;
          }
          .receipt-container, .header, .order-info, .items-table, .totals, .footer, .copy-label, .notes {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-container *, .header *, .order-info *, .items-table *, .totals *, .footer *, .copy-label *, .notes * {
            font-weight: 700 !important;
            color: #000000 !important;
          }
        }
      </style>
    </head>
    <body>
      ${generateReceiptHTML('kitchen')}
      ${generateReceiptHTML('customer')}
    </body>
    </html>
  `;

  printWindow.document.write(receiptHTML);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}
