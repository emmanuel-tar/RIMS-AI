
import React from 'react';
import { X, Printer, CheckCircle, Store } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { printReceipt } from '../services/printService';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  cartItems: { name: string; sku: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customerName?: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  isOpen, onClose, transactionId, cartItems, subtotal, discount, tax, total, customerName 
}) => {
  const { settings, currentUser, formatCurrency } = useInventory();

  if (!isOpen) return null;

  const handlePrint = () => {
    printReceipt({
      transactionId,
      items: cartItems,
      subtotal,
      discount,
      tax,
      total,
      customerName,
      storeSettings: settings,
      cashierName: currentUser?.name || 'Staff'
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        {/* Digital Action Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
           <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
             <CheckCircle size={16} />
             Sale Complete
           </div>
           <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400">
             <X size={18} />
           </button>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
           <div className="border border-slate-200 p-4 rounded-sm shadow-sm bg-white mx-auto max-w-[320px]">
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
                 <div className="flex justify-center mb-2 text-slate-800">
                   <Store size={24} />
                 </div>
                 <h2 className="text-lg font-bold uppercase text-slate-900 tracking-wider">{settings.storeName}</h2>
                 <p className="text-xs text-slate-500 mt-1">123 Retail Street, City, State</p>
                 <p className="text-xs text-slate-500">{settings.supportEmail}</p>
                 <p className="text-xs text-slate-500 mt-2">{new Date().toLocaleString()}</p>
                 <p className="text-xs text-slate-500">Cashier: {currentUser?.name || 'Staff'}</p>
                 <p className="text-xs text-slate-500 mt-1">Tx: {transactionId}</p>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4 text-sm">
                 {cartItems.map((item, idx) => (
                   <div key={idx} className="flex justify-between">
                      <div className="flex-1 pr-2">
                        <span className="block text-slate-800 font-medium">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.qty} x {formatCurrency(item.price)}</span>
                      </div>
                      <span className="text-slate-900 font-medium">{formatCurrency(item.qty * item.price)}</span>
                   </div>
                 ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-sm">
                 <div className="flex justify-between text-slate-600">
                   <span>Subtotal</span>
                   <span>{formatCurrency(subtotal)}</span>
                 </div>
                 {discount > 0 && (
                   <div className="flex justify-between text-slate-600">
                     <span>Discount</span>
                     <span>-{formatCurrency(discount)}</span>
                   </div>
                 )}
                 {tax > 0 && (
                   <div className="flex justify-between text-slate-600">
                     <span>Tax ({(settings.taxRate * 100).toFixed(1)}%)</span>
                     <span>{formatCurrency(tax)}</span>
                   </div>
                 )}
                 <div className="flex justify-between text-lg font-bold text-slate-900 mt-2 pt-2 border-t border-slate-200">
                   <span>Total</span>
                   <span>{formatCurrency(total)}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
           <button 
             onClick={onClose}
             className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
           >
             Close
           </button>
           <button 
             onClick={handlePrint}
             className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm"
           >
             <Printer size={18} />
             Print Receipt
           </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
