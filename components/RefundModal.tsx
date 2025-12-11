
import React, { useState, useMemo } from 'react';
import { X, Search, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { PaymentMethod } from '../types';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillTxId?: string;
}

const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, prefillTxId }) => {
  const { transactions, inventory, locations, processRefund } = useInventory();
  
  const [searchId, setSearchId] = useState(prefillTxId || '');
  const [activeTxId, setActiveTxId] = useState('');
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('CASH');
  const [restockInventory, setRestockInventory] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Find transaction items
  const txItems = useMemo(() => {
    if (!activeTxId) return [];
    return transactions.filter(t => t.id === activeTxId && t.type === 'SALE');
  }, [activeTxId, transactions]);

  const locationId = txItems[0]?.locationId || '';
  const customerId = txItems[0]?.customerId;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if(transactions.some(t => t.id === searchId)) {
        setActiveTxId(searchId);
        setRefundQuantities({});
        setSuccessMsg('');
    } else {
        alert('Transaction not found!');
    }
  };

  const handleQtyChange = (itemId: string, max: number, val: string) => {
    const num = Math.min(max, Math.max(0, parseInt(val) || 0));
    setRefundQuantities(prev => ({ ...prev, [itemId]: num }));
  };

  const handleProcessRefund = () => {
    const itemsToRefund = (Object.entries(refundQuantities) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));
    
    if (itemsToRefund.length === 0) return;

    processRefund(activeTxId, locationId, itemsToRefund, restockInventory, refundMethod);
    setSuccessMsg('Refund Processed Successfully');
    setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setActiveTxId('');
        setSearchId('');
        setRefundQuantities({});
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h2 className="font-bold text-slate-800 flex items-center gap-2">
             <RotateCcw className="text-amber-600" size={20} />
             Process Refund
           </h2>
           <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400">
             <X size={18} />
           </button>
        </div>

        {successMsg ? (
            <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{successMsg}</h3>
            </div>
        ) : (
            <div className="p-6 space-y-6">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Enter Transaction ID (e.g., TX-171...)" 
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium">
                        Lookup
                    </button>
                </form>

                {/* Tx Details */}
                {activeTxId && txItems.length > 0 ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm flex justify-between">
                            <div>
                                <span className="block text-slate-500">Date</span>
                                <span className="font-medium text-slate-800">{new Date(txItems[0].timestamp).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="block text-slate-500">Location</span>
                                <span className="font-medium text-slate-800">{locations.find(l => l.id === locationId)?.name}</span>
                            </div>
                             <div>
                                <span className="block text-slate-500">Original Payment</span>
                                <span className="font-medium text-slate-800">{txItems[0].paymentMethod || 'CASH'}</span>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Product</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Sold Qty</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Return Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {txItems.map((tx, idx) => {
                                        const item = inventory.find(i => i.id === tx.itemId);
                                        return (
                                            <tr key={`${tx.id}-${idx}`}>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="font-medium text-slate-900">{item?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{item?.sku}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">
                                                    {tx.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        max={tx.quantity}
                                                        value={refundQuantities[tx.itemId] || 0}
                                                        onChange={e => handleQtyChange(tx.itemId, tx.quantity, e.target.value)}
                                                        className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Refund Method</label>
                                <select 
                                    value={refundMethod}
                                    onChange={e => setRefundMethod(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="CASH">Cash Refund</option>
                                    <option value="CARD">Card Refund</option>
                                </select>
                            </div>
                             <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={restockInventory}
                                        onChange={e => setRestockInventory(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">Return items to stock?</span>
                                </label>
                            </div>
                        </div>

                        <button 
                            onClick={handleProcessRefund}
                            disabled={Object.values(refundQuantities).every(q => q === 0)}
                            className="w-full py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Process Refund
                        </button>
                    </div>
                ) : activeTxId ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                        <AlertCircle className="mx-auto mb-2 opacity-50" />
                        Transaction found, but contains no sale items.
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        Enter a transaction ID to start.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default RefundModal;
