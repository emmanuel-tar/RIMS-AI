
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, DollarSign, TrendingDown, TrendingUp, Briefcase } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Expense } from '../types';

const ExpensesView: React.FC = () => {
  const { expenses, locations, suppliers, inventory, transactions, addExpense, deleteExpense, currentUser, formatCurrency } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Omit<Expense, 'id' | 'recordedBy'>>({
    description: '',
    amount: 0,
    category: 'OTHER',
    date: new Date().toISOString().split('T')[0],
    locationId: '',
    supplierId: ''
  });

  const categories = ['RENT', 'UTILITIES', 'SALARY', 'MARKETING', 'MAINTENANCE', 'OTHER'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.amount > 0 && formData.locationId) {
      addExpense({
        ...formData,
        date: new Date(formData.date).toISOString(),
        recordedBy: currentUser?.name || 'Admin'
      });
      setIsModalOpen(false);
      setFormData({
        description: '',
        amount: 0,
        category: 'OTHER',
        date: new Date().toISOString().split('T')[0],
        locationId: '',
        supplierId: ''
      });
    }
  };

  // --- Financial Calculations (P&L) ---
  const financials = useMemo(() => {
    // 1. Calculate Revenue (Total Sales)
    const totalRevenue = transactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => {
        const item = inventory.find(i => i.id === t.itemId);
        // Fallback to current selling price if transaction price isn't stored (MVP limitation)
        return sum + (t.quantity * (item?.sellingPrice || 0));
      }, 0);

    // 2. Calculate COGS (Cost of Goods Sold)
    const totalCOGS = transactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => {
        const item = inventory.find(i => i.id === t.itemId);
        return sum + (t.quantity * (item?.costPrice || 0));
      }, 0);

    // 3. Total Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 4. Gross Profit (Revenue - COGS)
    const grossProfit = totalRevenue - totalCOGS;

    // 5. Net Profit (Gross Profit - Expenses)
    const netProfit = grossProfit - totalExpenses;

    return { totalRevenue, totalCOGS, totalExpenses, grossProfit, netProfit };
  }, [transactions, inventory, expenses]);


  return (
    <div className="space-y-6">
      {/* P&L Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(financials.totalRevenue)}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">COGS</p>
            <p className="text-2xl font-bold text-slate-600 mt-1">{formatCurrency(financials.totalCOGS)}</p>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(financials.totalExpenses)}</p>
         </div>
         <div className={`p-4 rounded-xl border shadow-sm ${financials.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${financials.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Profit</p>
            <div className="flex items-center gap-2 mt-1">
               <p className={`text-2xl font-bold ${financials.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                 {formatCurrency(financials.netProfit)}
               </p>
               {financials.netProfit >= 0 ? <TrendingUp size={20} className="text-green-600" /> : <TrendingDown size={20} className="text-red-600" />}
            </div>
         </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Expense Log</h2>
          <p className="text-sm text-slate-500">Track and categorize detailed operational costs.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Record Expense
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Recorded By</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {expense.supplierId ? suppliers.find(s => s.id === expense.supplierId)?.name : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {locations.find(l => l.id === expense.locationId)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {expense.recordedBy}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-800">
                    -{formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => {
                        if(confirm('Delete this expense record?')) deleteExpense(expense.id);
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                     No expenses recorded yet.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingDown className="text-red-600" size={20} />
                Record New Expense
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                  required 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Monthly Rent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                    <div className="relative">
                       <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         required 
                         type="number" 
                         step="0.01" 
                         min="0"
                         value={formData.amount || ''} 
                         onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                         className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      required 
                      type="date" 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value as any})} 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                       {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <select 
                      required
                      value={formData.locationId} 
                      onChange={e => setFormData({...formData, locationId: e.target.value})} 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                       <option value="">Select...</option>
                       {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Linked Supplier (Optional)</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select 
                    value={formData.supplierId || ''} 
                    onChange={e => setFormData({...formData, supplierId: e.target.value})} 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                     <option value="">None</option>
                     {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
                 >
                   Save Expense
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesView;
