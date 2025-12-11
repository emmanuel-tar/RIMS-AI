
import { InventoryItem, StoreSettings, Transaction } from "../types";

export interface PrintItem {
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  count: number;
}

export const printLabels = (items: PrintItem[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print labels.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Labels</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 10px; }
        @page { size: auto; margin: 0mm; }
        .print-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .label {
          width: 2.625in; 
          height: 1in;
          border: 1px dashed #ddd;
          padding: 8px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          page-break-inside: avoid;
        }
        @media print {
          .label { border: none; outline: 1px dotted #eee; }
          body { padding: 0; }
        }
        .product-name { font-size: 12px; font-weight: 700; overflow: hidden; white-space: nowrap; max-width: 100%; }
        .barcode { font-family: 'Libre Barcode 39 Text', cursive; font-size: 36px; line-height: 1; white-space: nowrap; }
        .meta { display: flex; justify-content: space-between; width: 100%; margin-top: 2px; }
        .sku { font-size: 10px; font-weight: 600; }
        .price { font-size: 14px; font-weight: 800; }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${items.map(item => Array.from({ length: item.count }).map(() => `
            <div class="label">
              <div class="product-name">${item.name}</div>
              <div class="barcode">*${(item.barcode || item.sku).toUpperCase()}*</div>
              <div class="meta">
                <span class="sku">SKU: ${item.sku}</span>
                <span class="price">$${item.price.toFixed(2)}</span>
              </div>
            </div>
        `).join('')).join('')}
      </div>
      <script>window.onload = () => window.print();</script>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

interface ReceiptData {
  transactionId: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  customerName?: string;
  storeSettings: StoreSettings;
  cashierName: string;
}

export const printReceipt = (data: ReceiptData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const width = data.storeSettings.hardware.receiptPrinterWidth === '58mm' ? '58mm' : '80mm';
  const fontSize = data.storeSettings.hardware.receiptPrinterWidth === '58mm' ? '10px' : '12px';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${data.transactionId}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', monospace; 
          margin: 0; 
          padding: 5px; 
          width: ${width}; 
          font-size: ${fontSize};
          color: #000;
        }
        @page { size: auto; margin: 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .border-b { border-bottom: 1px dashed #000; margin-bottom: 5px; padding-bottom: 5px; }
        .flex { display: flex; justify-content: space-between; }
        .item-row { margin-bottom: 3px; }
        .store-name { font-size: 1.2em; font-weight: 900; text-transform: uppercase; margin-bottom: 2px; }
      </style>
    </head>
    <body>
      <div class="text-center border-b">
        <div class="store-name">${data.storeSettings.storeName}</div>
        <div>${data.storeSettings.supportEmail}</div>
        <div>${new Date().toLocaleString()}</div>
        <div>Tx: ${data.transactionId}</div>
        <div>Cashier: ${data.cashierName}</div>
      </div>
      
      <div class="border-b">
        ${data.items.map(item => `
          <div class="item-row">
            <div>${item.name}</div>
            <div class="flex">
              <span>${item.qty} x ${item.price.toFixed(2)}</span>
              <span>${(item.qty * item.price).toFixed(2)}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="border-b">
        <div class="flex"><span>Subtotal</span><span>${data.subtotal.toFixed(2)}</span></div>
        ${data.discount > 0 ? `<div class="flex"><span>Discount</span><span>-${data.discount.toFixed(2)}</span></div>` : ''}
        <div class="flex font-bold" style="font-size: 1.1em; margin-top: 5px;">
          <span>Total</span><span>${data.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="text-center" style="margin-top: 10px;">
        ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ''}
        <div style="margin-top: 5px;">Thank you!</div>
      </div>

      <script>
        window.onload = () => {
          window.print();
          // Optional: setTimeout(() => window.close(), 100); 
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
