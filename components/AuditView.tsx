
import React, { useState, useMemo } from 'react';
import { Save, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { useInventory } from '../context/ShopContext';

const AuditView: React.FC = () => {
  const { locations, inventory, commitAudit } = useInventory();
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || '');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize counts with current system stock when location changes
  React.useEffect(() => {
    const initialCounts: Record<string, number> = {};
    inventory.forEach(item => {
      initialCounts[item.id] = item.stockDistribution[selectedLocationId] || 0;
    });
    setCounts(initialCounts);
    setIsSubmitted(false);
  }, [selectedLocationId, inventory]);

  const auditData = useMemo(() => {
    return inventory.map(item => {
      const systemQty = item.stockDistribution[selectedLocationId] || 0;
      const countedQty = counts[item.id] !== undefined ? counts[item.id] : systemQty;
      const variance = countedQty - systemQty;
      return {
        ...item,
        systemQty,
        countedQty,
        variance
      };
    });
  }, [inventory, selectedLocationId, counts]);

  const stats = useMemo(() => {
    const totalVariance = auditData.reduce((acc, item) => acc + Math.abs(item.variance), 0);
    const totalValueVariance = auditData.reduce((acc, item) => acc + (item.variance * item.sellingPrice), 0);
    const matchedItems = auditData.filter(i => i.variance === 0).length;
    return { totalVariance, totalValueVariance, matchedItems };
  }, [auditData]);

  const handleCountChange = (itemId: string, value: string) => {
    const num = parseInt(value) || 0;
    setCounts(prev => ({ ...prev, [itemId]: num }));
  };

  const handleSubmit = () => {
    if (confirm(`You are about to commit inventory adjustments for ${locations.find(l => l.id === selectedLocationId)?.name}. This action cannot be undone.`)) {
      const adjustments = auditData.map(item => ({
        itemId: item.id,
        systemQty: item.systemQty,
        countedQty: item.countedQty
      }));
      commitAudit(selectedLocationId, adjustments);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-slate-200 animate-in fade-in">
        <div className="bg-green-100 p-4 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Audit Completed!</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          Stock levels have been updated for <strong>{locations.find(l => l.id === selectedLocationId)?.name}</strong>. 
          Variances have been logged as transactions.
        </p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={18} />
          Start New Audit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             Stock Audit Session
             <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Draft</span>
           </h2>
           <p className="text-sm text-slate-500 mt-1">Enter physical counts to reconcile inventory.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
            ))}
          </select>
          <button 
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save size={18} />
            Commit Changes
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Items Matched</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.matchedItems} / {auditData.length}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Unit Variance</p>
            <p className={`text-2xl font-bold mt-1 ${stats.totalVariance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {stats.totalVariance} Units
            </p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Value Impact</p>
            <p className={`text-2xl font-bold mt-1 ${stats.totalValueVariance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.totalValueVariance > 0 ? '+' : ''}{stats.totalValueVariance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
         </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">System Qty</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Physical Qty</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Variance</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {auditData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{item.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{item.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600">
                    {item.systemQty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                     <input 
                       type="number" 
                       min="0"
                       value={item.countedQty}
                       onChange={(e) => handleCountChange(item.id, e.target.value)}
                       className={`w-24 px-3 py-1.5 text-center border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                         item.variance !== 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-300'
                       }`}
                     />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.variance === 0 
                          ? 'bg-slate-100 text-slate-500' 
                          : item.variance > 0 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                     }`}>
                        {item.variance > 0 ? '+' : ''}{item.variance}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     {item.variance === 0 ? (
                       <span className="flex items-center text-green-600 text-sm gap-1">
                         <CheckCircle size={16} /> Match
                       </span>
                     ) : (
                       <span className="flex items-center text-amber-600 text-sm gap-1">
                         <AlertTriangle size={16} /> {item.variance > 0 ? 'Surplus' : 'Shrinkage'}
                       </span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditView;
