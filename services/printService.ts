
import { InventoryItem, StoreSettings, Transaction } from "../types";

export interface PrintItem {
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  count: number;
}

export const printLabels = (items: PrintItem[], settings?: StoreSettings['labelTemplate']) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print labels.");
    return;
  }

  // Default fallback if settings not provided
  const template = settings || {
    size: '2x1-roll',
    showPrice: true,
    showName: true,
    showSKU: true,
    showBarcode: true
  };

  // Label Dimensions & CSS based on template size
  let labelCss = '';
  if (template.size === '2x1-roll') {
    labelCss = `
      width: 2in; 
      height: 1in; 
      margin-bottom: 2mm;
    `;
  } else if (template.size === '1x1-roll') {
    labelCss = `
      width: 1in; 
      height: 1in; 
      margin-bottom: 2mm;
    `;
  } else {
    // 30-up-sheet (Avery 5160)
    labelCss = `
      width: 2.625in; 
      height: 1in;
      float: left;
      margin-right: 0.12in;
      margin-bottom: 0.25in; /* Approximate gap */
    `;
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
        .print-container { 
           ${template.size === '30-up-sheet' ? 'width: 8.5in; margin: 0 auto;' : 'display: flex; flex-direction: column; align-items: center;'}
        }
        .label {
          ${labelCss}
          border: 1px dashed #ddd; /* Helper border */
          padding: 4px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          overflow: hidden;
          page-break-inside: avoid;
        }
        @media print {
          .label { border: none; outline: 0; }
          body { padding: 0; }
        }
        .product-name { font-size: 10px; font-weight: 700; line-height: 1.1; overflow: hidden; white-space: nowrap; max-width: 100%; margin-bottom: 2px; }
        .barcode { font-family: 'Libre Barcode 39 Text', cursive; font-size: 28px; line-height: 1; white-space: nowrap; }
        .meta { display: flex; justify-content: space-between; width: 100%; margin-top: 2px; padding: 0 4px; box-sizing: border-box; }
        .sku { font-size: 9px; font-weight: 600; }
        .price { font-size: 12px; font-weight: 800; }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${items.map(item => Array.from({ length: item.count }).map(() => `
            <div class="label">
              ${template.showName ? `<div class="product-name">${item.name}</div>` : ''}
              ${template.showBarcode ? `<div class="barcode">*${(item.barcode || item.sku).toUpperCase()}*</div>` : ''}
              <div class="meta">
                ${template.showSKU ? `<span class="sku">${item.sku}</span>` : '<span></span>'}
                ${template.showPrice ? `<span class="price">$${item.price.toFixed(2)}</span>` : '<span></span>'}
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
  tax: number;
  total: number;
  customerName?: string;
  storeSettings: StoreSettings;
  cashierName: string;
}

export const printReceipt = (data: ReceiptData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const { receiptTemplate, hardware, currencySymbol } = data.storeSettings;
  const isA4 = hardware.useA4Printer;
  const width = isA4 ? '210mm' : (hardware.receiptPrinterWidth === '58mm' ? '58mm' : '80mm');
  const fontSize = isA4 ? '12pt' : (hardware.receiptPrinterWidth === '58mm' ? '10px' : '12px');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${data.transactionId}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', monospace; 
          margin: 0; 
          padding: ${isA4 ? '20px' : '5px'}; 
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
        .logo { max-width: 60%; margin-bottom: 5px; }
        .footer { font-size: 0.9em; margin-top: 10px; white-space: pre-wrap; }
        .barcode { font-family: 'Libre Barcode 39 Text', cursive; font-size: 32px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="text-center border-b">
        ${receiptTemplate.showLogo && receiptTemplate.logoUrl ? `<img src="${receiptTemplate.logoUrl}" class="logo" />` : ''}
        ${receiptTemplate.includeName !== false ? `<div class="store-name">${data.storeSettings.storeName}</div>` : ''}
        ${receiptTemplate.headerText ? `<div>${receiptTemplate.headerText}</div>` : ''}
        ${receiptTemplate.includeAddress !== false ? `<div>123 Retail Street, City, State</div>` : ''}
        ${receiptTemplate.includePhone !== false ? `<div>${data.storeSettings.supportEmail}</div>` : ''}
        
        <div>${new Date().toLocaleString()}</div>
        <div>Tx: ${data.transactionId}</div>
        ${receiptTemplate.showCashier ? `<div>Cashier: ${data.cashierName}</div>` : ''}
      </div>
      
      <div class="border-b">
        ${data.items.map(item => `
          <div class="item-row">
            <div>${item.name}</div>
            <div class="flex">
              <span>${item.qty} x ${currencySymbol}${item.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              <span>${currencySymbol}${(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="border-b">
        <div class="flex"><span>Subtotal</span><span>${currencySymbol}${data.subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
        ${data.discount > 0 ? `<div class="flex"><span>Discount</span><span>-${currencySymbol}${data.discount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>` : ''}
        ${receiptTemplate.showTaxBreakdown && data.tax > 0 ? `<div class="flex"><span>Tax (${(data.storeSettings.taxRate * 100).toFixed(1)}%)</span><span>${currencySymbol}${data.tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>` : ''}
        <div class="flex font-bold" style="font-size: 1.1em; margin-top: 5px;">
          <span>Total</span><span>${currencySymbol}${data.total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      </div>
      
      <div class="text-center" style="margin-top: 10px;">
        ${data.customerName ? `<div>Customer: ${data.customerName}</div>` : ''}
        <div class="footer">${receiptTemplate.footerText}</div>
        ${receiptTemplate.barcodeAtBottom ? `<div class="barcode">*${data.transactionId}*</div>` : ''}
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
