
import React, { useState } from 'react';
import { Plus, Eye, CheckCircle, Clock, AlertCircle, FileText, PackageCheck } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { PurchaseOrder } from '../types';
import PurchaseOrderModal from './PurchaseOrderModal';

const PurchaseOrdersView: React.FC = () => {
  const { purchaseOrders, suppliers, receivePurchaseOrder } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-600';
      case 'ORDERED': return 'bg-blue-100 text-blue-700';
      case 'RECEIVED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleReceive = (poId: string) => {
    // For simplicity, default to first location or ask user. 
    // In this UI, we'll prompt for location ID in a real scenario, but here hardcode to first location or just trigger.
    // The context function signature is receivePurchaseOrder(id: string, locationId: string)
    // We will assume loc-1 for this simplified view or use a prompt.
    const locId = prompt("Enter Location ID to receive stock into (e.g. loc-1):", "loc-1");
    if (locId) {
      receivePurchaseOrder(poId, locId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Purchase Orders</h2>
          <p className="text-sm text-slate-500">Track incoming stock and manage supplier orders.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Order
        </button>
      </div>

      {/* PO List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PO #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{po.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{getSupplierName(po.supplierId)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                    ${po.totalCost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-500">
                    {new Date(po.dateCreated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                       <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                         <FileText size={18} />
                       </button>
                       {po.status === 'ORDERED' && (
                         <button 
                           onClick={() => handleReceive(po.id)}
                           className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded" 
                           title="Receive Stock"
                         >
                           <PackageCheck size={18} />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {purchaseOrders.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                     No purchase orders found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PurchaseOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default PurchaseOrdersView;
