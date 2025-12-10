
import React, { useState } from 'react';
import { Plus, Edit2, Shield, User, MapPin } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Employee } from '../types';

const TeamView: React.FC = () => {
  const { employees, locations, addEmployee, updateEmployee } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
     name: '', email: '', role: 'CASHIER', status: 'ACTIVE', phone: ''
  });

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({ name: '', email: '', role: 'CASHIER', status: 'ACTIVE', phone: '', assignedLocationId: '' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
       updateEmployee(editingId, formData);
    } else {
       addEmployee(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
          <p className="text-sm text-slate-500">Manage employee access, roles, and location assignments.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
           <div key={emp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${emp.role === 'ADMIN' ? 'bg-purple-500' : emp.role === 'MANAGER' ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
              <div className="flex justify-between items-start mb-4 pl-3">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                       <User size={20} className="text-slate-500" />
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-900">{emp.name}</h3>
                       <p className="text-xs text-slate-500">{emp.email}</p>
                    </div>
                 </div>
                 <button onClick={() => handleEdit(emp)} className="text-slate-400 hover:text-indigo-600 p-1">
                   <Edit2 size={16} />
                 </button>
              </div>

              <div className="pl-3 space-y-3">
                 <div className="flex items-center gap-2">
                    <Shield size={14} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">{emp.role}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                       {emp.assignedLocationId 
                         ? locations.find(l => l.id === emp.assignedLocationId)?.name 
                         : 'All Locations'}
                    </span>
                 </div>
                 <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.status}
                    </span>
                 </div>
              </div>
           </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Employee' : 'New Employee'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                       <option value="CASHIER">Cashier</option>
                       <option value="MANAGER">Manager</option>
                       <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Location</label>
                    <select value={formData.assignedLocationId || ''} onChange={e => setFormData({...formData, assignedLocationId: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                       <option value="">All Locations</option>
                       {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Employee</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;
