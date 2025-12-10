
import React, { useState } from 'react';
import { Plus, Mail, Phone, MapPin, Star, Edit2, User } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Supplier } from '../types';

const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '', contactPerson: '', email: '', phone: '', address: '', rating: 5
  });

  const handleEdit = (supplier: Supplier) => {
    setFormData(supplier);
    setEditingId(supplier.id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', rating: 5 });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSupplier(editingId, formData);
    } else {
      addSupplier(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Supplier Management</h2>
          <p className="text-sm text-slate-500">Manage vendor relationships and contact details.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {supplier.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{supplier.name}</h3>
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    <Star size={12} fill="currentColor" />
                    <span className="text-slate-600">{supplier.rating}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleEdit(supplier)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              >
                <Edit2 size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <User size={16} className="text-slate-400" />
                <span>{supplier.contactPerson}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${supplier.email}`} className="hover:text-indigo-600">{supplier.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-slate-400 mt-0.5" />
                <span>{supplier.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Supplier' : 'New Supplier'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                    <input required type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1-5)</label>
                    <input type="number" min="1" max="5" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
