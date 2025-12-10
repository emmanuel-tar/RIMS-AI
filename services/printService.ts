import { InventoryItem } from "../types";

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

  const date = new Date().toLocaleDateString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Labels</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 10px;
        }
        
        @page {
          size: auto;
          margin: 0mm;
        }

        .print-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .label {
          width: 2.625in; /* Standard Avery Address Label size roughly */
          height: 1in;
          border: 1px dashed #ddd; /* Dashed line for cutting guide, remove if using label paper */
          padding: 8px;
          box-sizing: border-box;
          display: flex;
          flex-col;
          justify-content: center;
          align-items: center;
          text-align: center;
          page-break-inside: avoid;
          overflow: hidden;
        }

        /* Hide borders when actually printing if desired, but helpful for alignment */
        @media print {
          .label {
            border: none;
            outline: 1px dotted #eee; /* Faint guide */
          }
          body { padding: 0; }
        }

        .company-name {
          font-size: 10px;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 2px;
        }

        .product-name {
          font-size: 12px;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .barcode {
          font-family: 'Libre Barcode 39 Text', cursive;
          font-size: 36px;
          line-height: 1;
          white-space: nowrap;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-top: 2px;
          align-items: flex-end;
        }

        .sku {
          font-size: 10px;
          font-weight: 600;
        }

        .price {
          font-size: 14px;
          font-weight: 800;
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        ${items.map(item => {
          // Repeat label for item.count
          return Array.from({ length: item.count }).map(() => `
            <div class="label">
              <div class="company-name">RIMS Retail</div>
              <div class="product-name">${item.name}</div>
              <div class="barcode">*${(item.barcode || item.sku).toUpperCase()}*</div>
              <div class="meta">
                <span class="sku">SKU: ${item.sku}</span>
                <span class="price">$${item.price.toFixed(2)}</span>
              </div>
            </div>
          `).join('');
        }).join('')}
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
