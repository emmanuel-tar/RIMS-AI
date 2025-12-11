
import React, { useState } from 'react';
import { X, PackageCheck, Calendar, Printer, FileText } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { PurchaseOrder } from '../types';
import { printLabels } from '../services/printService';

interface ReceivePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

const ReceivePOModal: React.FC<ReceivePOModalProps> = ({ isOpen, onClose, purchaseOrder }) => {
  const { locations, receivePurchaseOrder, inventory } = useInventory();
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [successMode, setSuccessMode] = useState(false);
  
  // State for batch details per item: { itemId: { batchNumber, expiryDate } }
  const [batchDetails, setBatchDetails] = useState<Record<string, { batchNumber: string, expiryDate: string }>>({});

  if (!isOpen || !purchaseOrder) return null;

  const handleBatchChange = (itemId: string, field: 'batchNumber' | 'expiryDate', value: string) => {
    setBatchDetails(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { batchNumber: '', expiryDate: '' }),
        [field]: value
      }
    }));
  };

  const handleReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocationId && invoiceNumber) {
      receivePurchaseOrder(purchaseOrder.id, selectedLocationId, invoiceNumber, batchDetails);
      setSuccessMode(true);
    }
  };

  const handlePrintLabels = () => {
    const itemsToPrint = purchaseOrder.items.map(item => {
        const product = inventory.find(p => p.id === item.itemId);
        return {
            name: product?.name || 'Item',
            sku: product?.sku || 'SKU',
            barcode: product?.barcode || product?.sku,
            price: product?.sellingPrice || 0,
            count: item.quantity
        };
    });
    printLabels(itemsToPrint);
  };

  const handleClose = () => {
      setSuccessMode(false);
      setSelectedLocationId('');
      setInvoiceNumber('');
      setBatchDetails({});
      onClose();
  };

  const getItemName = (id: string) => inventory.find(i => i.id === id)?.name || id;

  if (successMode) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <PackageCheck size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Stock Received Successfully!</h2>
                <p className="text-slate-500 mb-6">
                    Inventory has been updated for {locations.find(l => l.id === selectedLocationId)?.name}.
                    <br/><span className="text-xs text-slate-400">Invoice #{invoiceNumber} Recorded</span>
                </p>
                <div className="space-y-3">
                    <button 
                        onClick={handlePrintLabels}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                        <Printer size={20} />
                        Print Barcode Labels ({purchaseOrder.items.reduce((a,b) => a + b.quantity, 0)})
                    </button>
                    <button 
                        onClick={handleClose}
                        className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <PackageCheck className="text-green-600" size={20} />
            Receive Stock / Convert to Invoice
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleReceive} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Purchase Order</p>
                    <p className="font-semibold text-slate-900">{purchaseOrder.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Total Items</p>
                    <p className="font-semibold text-slate-900">{purchaseOrder.items.length}</p>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination Location</label>
                  <select 
                    value={selectedLocationId} 
                    onChange={e => setSelectedLocationId(e.target.value)}
                    required
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Select Location --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Supplier Invoice #</label>
                   <div className="relative">
                      <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                         type="text" 
                         required
                         value={invoiceNumber}
                         onChange={e => setInvoiceNumber(e.target.value)}
                         placeholder="e.g. INV-2023-999"
                         className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                   </div>
                </div>
            </div>
            
            <div className="space-y-3">
               <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">Batch Details (Optional)</h3>
               <p className="text-xs text-slate-500">Enter batch numbers and expiry dates for tracking.</p>
               
               <div className="space-y-4">
                 {purchaseOrder.items.map(item => (
                   <div key={item.itemId} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="flex justify-between mb-2">
                         <span className="font-medium text-sm text-slate-900">{getItemName(item.itemId)}</span>
                         <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs text-slate-500 mb-1">Batch #</label>
                            <input 
                              type="text" 
                              placeholder="e.g. BATCH-001"
                              value={batchDetails[item.itemId]?.batchNumber || ''}
                              onChange={e => handleBatchChange(item.itemId, 'batchNumber', e.target.value)}
                              className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                         </div>
                         <div>
                            <label className="block text-xs text-slate-500 mb-1">Expiry Date</label>
                            <input 
                              type="date" 
                              value={batchDetails[item.itemId]?.expiryDate || ''}
                              onChange={e => handleBatchChange(item.itemId, 'expiryDate', e.target.value)}
                              className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <button
              type="submit"
              disabled={!selectedLocationId || !invoiceNumber}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Confirm Invoice & Add Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceivePOModal;
