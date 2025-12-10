
import React, { useState } from 'react';
import { X, PackageCheck } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { PurchaseOrder } from '../types';

interface ReceivePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
}

const ReceivePOModal: React.FC<ReceivePOModalProps> = ({ isOpen, onClose, purchaseOrder }) => {
  const { locations, receivePurchaseOrder } = useInventory();
  const [selectedLocationId, setSelectedLocationId] = useState('');

  if (!isOpen || !purchaseOrder) return null;

  const handleReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocationId) {
      receivePurchaseOrder(purchaseOrder.id, selectedLocationId);
      onClose();
      setSelectedLocationId('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <PackageCheck className="text-green-600" size={20} />
            Receive Stock
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleReceive} className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <p className="text-sm text-slate-500 mb-1">Purchase Order</p>
             <p className="font-semibold text-slate-900">{purchaseOrder.id}</p>
             <p className="text-xs text-slate-500 mt-1">
               {purchaseOrder.items.length} unique items, Total Cost: ${purchaseOrder.totalCost.toLocaleString()}
             </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Destination Location</label>
            <p className="text-xs text-slate-500 mb-2">Select which warehouse or store will receive this physical stock.</p>
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

          <button
            type="submit"
            disabled={!selectedLocationId}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Receipt
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReceivePOModal;
