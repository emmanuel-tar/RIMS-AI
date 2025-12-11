import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { InventoryItem } from '../types';
import { useInventory } from '../context/ShopContext';

interface BulkAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: InventoryItem[];
  defaultLocationId: string;
}

const BulkAdjustModal: React.FC<BulkAdjustModalProps> = ({ isOpen, onClose, selectedItems, defaultLocationId }) => {
  const { locations, bulkAdjustStock } = useInventory();
  
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [reason, setReason] = useState('Bulk Adjustment');
  
  // Map of itemId -> adjustment quantity (+/-)
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      setLocationId(defaultLocationId === 'all' ? locations[0]?.id : defaultLocationId);
      setReason('Bulk Adjustment');
      // Initialize adjustments to 0
      const initialAdjustments: Record<string, number> = {};
      selectedItems.forEach(item => {
        initialAdjustments[item.id] = 0;
      });
      setAdjustments(initialAdjustments);
    }
  }, [isOpen, selectedItems, defaultLocationId, locations]);

  if (!isOpen) return null;

  const handleAdjustmentChange = (itemId: string, val: string) => {
    const num = parseInt(val) || 0;
    setAdjustments(prev => ({ ...prev, [itemId]: num }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert to array format expected by context
    const payload = Object.entries(adjustments)
      .filter(([_, qty]) => qty !== 0) // Only include non-zero adjustments
      .map(([id, quantityChange]) => ({
        id,
        quantityChange
      }));

    if (payload.length > 0 && locationId) {
      bulkAdjustStock(payload, locationId, reason);
      onClose();
    } else if (payload.length === 0) {
      alert("No quantity changes were entered.");
    }
  };

  const totalChange = (Object.values(adjustments) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw size={20} className="text-indigo-600" />
            Bulk Stock Adjustment
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Controls */}
          <div className="p-6 bg-white border-b border-slate-100 grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Target Location</label>
               <select
                 value={locationId}
                 onChange={(e) => setLocationId(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                 required
               >
                 {locations.map(loc => (
                   <option key={loc.id} value={loc.id}>{loc.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Reason Code</label>
               <select
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
               >
                 <option>Bulk Restock</option>
                 <option>Inventory Correction</option>
                 <option>Damage / Write-off</option>
                 <option>Return to Vendor</option>
                 <option>Other</option>
               </select>
             </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto p-0">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-40">Adjustment (+/-)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">New Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {selectedItems.map(item => {
                  const currentStock = item.stockDistribution[locationId] || 0;
                  const adj = adjustments[item.id] || 0;
                  const newTotal = currentStock + adj;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-500 font-mono">{item.sku}</td>
                      <td className="px-6 py-3 text-center text-sm text-slate-600">{currentStock}</td>
                      <td className="px-6 py-3 text-center">
                        <input 
                          type="number" 
                          value={adj === 0 ? '' : adj}
                          placeholder="0"
                          onChange={(e) => handleAdjustmentChange(item.id, e.target.value)}
                          className={`w-24 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-indigo-500 text-sm font-bold ${
                            adj > 0 ? 'text-green-600 border-green-300 bg-green-50' : 
                            adj < 0 ? 'text-red-600 border-red-300 bg-red-50' : 'border-slate-300'
                          }`}
                        />
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                        {newTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
             <div className="text-sm font-medium text-slate-600">
               Total Adjustment: 
               <span className={`ml-2 ${totalChange > 0 ? 'text-green-600' : totalChange < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                 {totalChange > 0 ? '+' : ''}{totalChange} units
               </span>
             </div>
             <div className="flex gap-3">
               <button 
                 type="button" 
                 onClick={onClose} 
                 className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
               >
                 Cancel
               </button>
               <button 
                 type="submit" 
                 className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
               >
                 <Save size={16} />
                 Apply {selectedItems.length} Changes
               </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAdjustModal;