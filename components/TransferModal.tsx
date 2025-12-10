
import React, { useState } from 'react';
import { X, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { InventoryItem } from '../types';
import { useInventory } from '../context/ShopContext';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, item }) => {
  const { locations, transferStock } = useInventory();
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLoc && toLoc && fromLoc !== toLoc && quantity > 0) {
      transferStock(item.id, fromLoc, toLoc, quantity);
      onClose();
      // Reset form
      setFromLoc('');
      setToLoc('');
      setQuantity(1);
    }
  };

  const maxAvailable = fromLoc ? (item.stockDistribution[fromLoc] || 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="text-indigo-600" size={20} />
            Transfer Stock
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg">
             <p className="text-sm text-slate-500 mb-1">Product</p>
             <p className="font-semibold text-slate-900">{item.name}</p>
             <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
          </div>

          <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Source</label>
              <select 
                value={fromLoc} 
                onChange={e => setFromLoc(e.target.value)}
                required
                className="w-full text-sm p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === toLoc}>
                    {loc.name} ({item.stockDistribution[loc.id] || 0})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="pb-3 text-slate-400">
              <ArrowRight size={20} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Destination</label>
              <select 
                value={toLoc} 
                onChange={e => setToLoc(e.target.value)}
                required
                className="w-full text-sm p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === fromLoc}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Move</label>
             <input
               type="number"
               min="1"
               max={maxAvailable}
               value={quantity}
               onChange={e => setQuantity(Number(e.target.value))}
               className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
             />
             <p className="text-xs text-slate-500 mt-1">
               Max available: {maxAvailable}
             </p>
          </div>

          <button
            type="submit"
            disabled={!fromLoc || !toLoc || quantity <= 0 || quantity > maxAvailable}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Transfer
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
