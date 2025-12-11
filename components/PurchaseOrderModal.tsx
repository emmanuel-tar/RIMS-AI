
import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useInventory } from '../context/ShopContext';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ isOpen, onClose }) => {
  const { suppliers, inventory, createPurchaseOrder, formatCurrency } = useInventory();
  
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ itemId: string; quantity: number; costPrice: number }[]>([]);

  // Item form state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  
  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!selectedItemId || itemQty <= 0) return;
    
    const product = inventory.find(i => i.id === selectedItemId);
    if (!product) return;

    setItems(prev => [
      ...prev,
      { itemId: selectedItemId, quantity: itemQty, costPrice: product.costPrice }
    ]);
    
    // Reset item form
    setSelectedItemId('');
    setItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;

    createPurchaseOrder({
       supplierId,
       items,
       notes
    });
    
    onClose();
    // Reset all
    setSupplierId('');
    setNotes('');
    setItems([]);
  };

  const totalCost = items.reduce((acc, item) => acc + (item.quantity * item.costPrice), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Create Purchase Order</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supplier Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Supplier</label>
            <select 
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Add Items Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase">Add Products</h3>
            <div className="flex gap-2 items-end">
               <div className="flex-1">
                 <label className="block text-xs font-semibold text-slate-500 mb-1">Product</label>
                 <select 
                   value={selectedItemId}
                   onChange={e => setSelectedItemId(e.target.value)}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                 >
                   <option value="">Select Product...</option>
                   {inventory.map(item => (
                     <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                   ))}
                 </select>
               </div>
               <div className="w-24">
                 <label className="block text-xs font-semibold text-slate-500 mb-1">Qty</label>
                 <input 
                   type="number" 
                   min="1"
                   value={itemQty}
                   onChange={e => setItemQty(Number(e.target.value))}
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                 />
               </div>
               <button 
                 type="button" 
                 onClick={handleAddItem}
                 disabled={!selectedItemId}
                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
               >
                 Add
               </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
             <table className="min-w-full divide-y divide-slate-200">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Product</th>
                   <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Qty</th>
                   <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Cost</th>
                   <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Total</th>
                   <th className="px-4 py-2 w-10"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 bg-white">
                 {items.map((item, idx) => {
                   const product = inventory.find(i => i.id === item.itemId);
                   return (
                     <tr key={idx}>
                       <td className="px-4 py-2 text-sm">{product?.name || item.itemId}</td>
                       <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                       <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.costPrice)}</td>
                       <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.quantity * item.costPrice)}</td>
                       <td className="px-4 py-2 text-center">
                         <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   );
                 })}
                 {items.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No items added yet.</td>
                   </tr>
                 )}
               </tbody>
               <tfoot className="bg-slate-50">
                 <tr>
                   <td colSpan={3} className="px-4 py-3 text-right font-bold text-slate-700">Total Estimated Cost:</td>
                   <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(totalCost)}</td>
                   <td></td>
                 </tr>
               </tfoot>
             </table>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Cancel</button>
           <button 
             onClick={handleSubmit}
             disabled={!supplierId || items.length === 0}
             className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium disabled:opacity-50"
           >
             <Save size={18} />
             Create Order
           </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
