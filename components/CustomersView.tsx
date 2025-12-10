
import React, { useState } from 'react';
import { Search, Plus, User, Star, History, Edit2 } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Customer } from '../types';

const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useInventory();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent'>>({
     name: '', phone: '', email: ''
  });

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleEdit = (cust: Customer) => {
    setFormData({ name: cust.name, phone: cust.phone, email: cust.email || '', notes: cust.notes });
    setEditingId(cust.id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({ name: '', phone: '', email: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
       updateCustomer(editingId, formData);
    } else {
       addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Customer Relationships</h2>
          <p className="text-sm text-slate-500">Track loyalty points and customer purchase history.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Search customers..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
             />
          </div>
          <button 
            onClick={handleAddNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <Plus size={18} />
            New Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
           <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                 <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Loyalty Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Total Spent</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Last Visit</th>
                    <th className="px-6 py-4 w-10"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                 {filtered.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50">
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                {cust.name.substring(0,2).toUpperCase()}
                             </div>
                             <div>
                                <p className="text-sm font-medium text-slate-900">{cust.name}</p>
                                {cust.notes && <p className="text-xs text-slate-400 italic truncate max-w-[150px]">{cust.notes}</p>}
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">
                             <p>{cust.phone}</p>
                             <p className="text-xs text-slate-400">{cust.email}</p>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <Star className={`w-4 h-4 ${cust.loyaltyPoints > 500 ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                             <span className="text-sm font-bold text-slate-700">{cust.loyaltyPoints} pts</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-right text-sm text-slate-900 font-medium">
                          ${cust.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </td>
                       <td className="px-6 py-4 text-right text-sm text-slate-500">
                          {cust.lastVisit ? new Date(cust.lastVisit).toLocaleDateString() : 'Never'}
                       </td>
                       <td className="px-6 py-4">
                          <button onClick={() => handleEdit(cust)} className="text-slate-400 hover:text-indigo-600">
                             <Edit2 size={16} />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                 <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Customer</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;
