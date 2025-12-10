
import React, { useState, useMemo, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle, RotateCcw, Search, ArrowRight, Filter, Calculator, ArrowLeft } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Category } from '../types';

type AuditStep = 'SETUP' | 'COUNTING' | 'REVIEW' | 'SUCCESS';

const AuditView: React.FC = () => {
  const { locations, inventory, commitAudit } = useInventory();
  
  // State
  const [step, setStep] = useState<AuditStep>('SETUP');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hideMatched, setHideMatched] = useState(false);

  // Initialize location default
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Filter items based on setup scope
  const scopedItems = useMemo(() => {
    return inventory.filter(item => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      return true;
    });
  }, [inventory, selectedCategory]);

  // Prepare Data for Audit Table
  const auditData = useMemo(() => {
    return scopedItems.map(item => {
      const systemQty = item.stockDistribution[selectedLocationId] || 0;
      // Default to system qty if not counted yet, or 0? 
      // Usually better to default to system qty to avoid mass zeroing, 
      // or track "isCounted" separately. For MVP, we assume current value in input is the count.
      const countedQty = counts[item.id] !== undefined ? counts[item.id] : systemQty;
      const variance = countedQty - systemQty;
      
      return {
        ...item,
        systemQty,
        countedQty,
        variance,
        isCounted: counts[item.id] !== undefined
      };
    }).filter(item => {
      // Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      }
      return true;
    }).filter(item => {
      // Hide Matched Filter
      if (hideMatched) return item.variance !== 0;
      return true;
    });
  }, [scopedItems, selectedLocationId, counts, searchQuery, hideMatched]);

  // Stats
  const stats = useMemo(() => {
    const totalVarianceQty = auditData.reduce((acc, item) => acc + Math.abs(item.variance), 0);
    const totalVarianceValue = auditData.reduce((acc, item) => acc + (item.variance * item.sellingPrice), 0);
    const itemsWithVariance = auditData.filter(i => i.variance !== 0).length;
    return { totalVarianceQty, totalVarianceValue, itemsWithVariance };
  }, [auditData]);

  // Handlers
  const handleCountChange = (itemId: string, value: string) => {
    const num = value === '' ? 0 : parseInt(value);
    setCounts(prev => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleStartAudit = () => {
    // Reset counts for new session
    setCounts({});
    setStep('COUNTING');
  };

  const handleCommit = () => {
    const adjustments = scopedItems.map(item => {
        const systemQty = item.stockDistribution[selectedLocationId] || 0;
        const countedQty = counts[item.id] !== undefined ? counts[item.id] : systemQty;
        return {
            itemId: item.id,
            systemQty,
            countedQty
        };
    }).filter(adj => adj.systemQty !== adj.countedQty); // Only commit actual changes

    commitAudit(selectedLocationId, adjustments);
    setStep('SUCCESS');
  };

  // --- RENDER STEPS ---

  if (step === 'SETUP') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
           <div className="bg-indigo-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-indigo-600">
              <Calculator size={40} />
           </div>
           <h2 className="text-2xl font-bold text-slate-900">New Audit Session</h2>
           <p className="text-slate-500 mt-2 max-w-md mx-auto">
             Start a guided stock count to ensure inventory accuracy. Select the scope of your audit below.
           </p>

           <div className="mt-8 space-y-4 text-left max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Location</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Filter (Optional)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ALL">All Categories</option>
                  {Object.values(Category).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
           </div>

           <button 
             onClick={handleStartAudit}
             disabled={!selectedLocationId}
             className="mt-8 w-full max-w-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
           >
             Start Counting <ArrowRight size={20} />
           </button>
        </div>
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-slate-200 animate-in fade-in zoom-in">
        <div className="bg-green-100 p-4 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Audit Completed!</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          Stock levels have been updated for <strong>{locations.find(l => l.id === selectedLocationId)?.name}</strong>. 
          Variances have been logged to the activity history.
        </p>
        <button 
          onClick={() => setStep('SETUP')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw size={18} />
          Start New Audit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
           {step === 'REVIEW' && (
             <button onClick={() => setStep('COUNTING')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
               <ArrowLeft size={20} />
             </button>
           )}
           <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               {step === 'COUNTING' ? 'Stock Count' : 'Review Discrepancies'}
               <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                 {selectedCategory === 'ALL' ? 'Full Inventory' : selectedCategory}
               </span>
             </h2>
             <p className="text-sm text-slate-500">
               {locations.find(l => l.id === selectedLocationId)?.name}
             </p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          {step === 'COUNTING' ? (
             <button 
               onClick={() => setStep('REVIEW')}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
             >
               Review Changes <ArrowRight size={18} />
             </button>
          ) : (
             <button 
               onClick={handleCommit}
               className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
             >
               <Save size={18} />
               Finalize & Commit
             </button>
          )}
        </div>
      </div>

      {/* Stats Bar (Visible in Review, or sticky in Counting) */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase">Items Scanned</p>
            <p className="text-xl font-bold text-slate-800 mt-1">
              {Object.keys(counts).length} / {scopedItems.length}
            </p>
         </div>
         <div className={`p-4 rounded-xl border shadow-sm ${stats.totalVarianceQty !== 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase">Unit Variance</p>
            <p className={`text-xl font-bold mt-1 ${stats.totalVarianceQty !== 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {stats.totalVarianceQty} Units
            </p>
         </div>
         <div className={`p-4 rounded-xl border shadow-sm ${stats.totalVarianceValue !== 0 ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase">Value Impact</p>
            <p className={`text-xl font-bold mt-1 ${stats.totalVarianceValue > 0 ? 'text-green-600' : stats.totalVarianceValue < 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {stats.totalVarianceValue > 0 ? '+' : ''}{stats.totalVarianceValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
         </div>
      </div>

      {/* COUNTING TOOLS */}
      {step === 'COUNTING' && (
        <div className="flex gap-4 shrink-0">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Search product by name or SKU..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
               autoFocus
             />
           </div>
           <button 
             onClick={() => setHideMatched(!hideMatched)}
             className={`px-4 py-2 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors ${
               hideMatched ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
             }`}
           >
             <Filter size={16} />
             {hideMatched ? 'Showing Discrepancies' : 'Show All'}
           </button>
        </div>
      )}

      {/* TABLE AREA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="min-w-full divide-y divide-slate-200 relative">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">System Qty</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-32">Physical Qty</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Variance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {step === 'REVIEW' && auditData.filter(i => i.variance === 0).length === auditData.length && (
                 <tr>
                   <td colSpan={5} className="py-12 text-center text-slate-500">
                     <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                     <p className="text-lg font-medium text-slate-800">Perfect Match!</p>
                     <p>There are no discrepancies to review.</p>
                   </td>
                 </tr>
              )}
              
              {/* In REVIEW mode, show only items with variance (unless filter settings allow otherwise, but review usually focuses on diffs) */}
              {(step === 'REVIEW' ? auditData.filter(i => i.variance !== 0) : auditData).map((item) => (
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
                     {step === 'COUNTING' ? (
                       <input 
                         type="number" 
                         min="0"
                         placeholder={item.systemQty.toString()}
                         value={counts[item.id] !== undefined ? counts[item.id] : ''}
                         onChange={(e) => handleCountChange(item.id, e.target.value)}
                         className={`w-24 px-3 py-1.5 text-center border rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                           item.variance !== 0 && counts[item.id] !== undefined ? 'border-amber-300 bg-amber-50' : 'border-slate-300'
                         }`}
                       />
                     ) : (
                       <span className="font-bold text-slate-900">{item.countedQty}</span>
                     )}
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
