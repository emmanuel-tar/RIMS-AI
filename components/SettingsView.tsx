
import React, { useState } from 'react';
import { Save, Building, MapPin, Database, Download, Plus, Trash2 } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Location } from '../types';

const SettingsView: React.FC = () => {
  const { settings, updateSettings, locations, addLocation, exportData } = useInventory();
  const [activeTab, setActiveTab] = useState<'general' | 'locations' | 'data'>('general');

  // Local state for new location form
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocType, setNewLocType] = useState<'STORE' | 'WAREHOUSE'>('STORE');

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this might trigger an API call. 
    // Here, context updates are immediate, so we just show visual feedback if needed.
    alert("Settings saved successfully.");
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if(newLocName && newLocAddress) {
      addLocation({
        name: newLocName,
        address: newLocAddress,
        type: newLocType
      });
      setNewLocName('');
      setNewLocAddress('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">System Settings</h2>
        <p className="text-sm text-slate-500">Configure your store profile, locations, and data preferences.</p>
        
        {/* Tabs */}
        <div className="flex gap-4 mt-6 border-b border-slate-200">
           <button 
             onClick={() => setActiveTab('general')}
             className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
               activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
           >
             General Profile
           </button>
           <button 
             onClick={() => setActiveTab('locations')}
             className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
               activeTab === 'locations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
           >
             Locations
           </button>
           <button 
             onClick={() => setActiveTab('data')}
             className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
               activeTab === 'data' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
           >
             Data Management
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
        
        {/* General Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleGeneralSubmit} className="p-6 max-w-2xl space-y-6">
             <div className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                   <input 
                     type="text" 
                     value={settings.storeName}
                     onChange={(e) => updateSettings({ storeName: e.target.value })}
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Currency Symbol</label>
                     <input 
                       type="text" 
                       value={settings.currencySymbol}
                       onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
                       className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (Decimal)</label>
                     <input 
                       type="number"
                       step="0.01" 
                       value={settings.taxRate}
                       onChange={(e) => updateSettings({ taxRate: parseFloat(e.target.value) })}
                       className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                     />
                     <p className="text-xs text-slate-500 mt-1">Example: 0.08 for 8% tax</p>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Support / Admin Email</label>
                   <input 
                     type="email" 
                     value={settings.supportEmail}
                     onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                     className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
             </div>

             <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2">
               <Save size={18} />
               Save Changes
             </button>
          </form>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="p-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* List */}
               <div className="space-y-4">
                 <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                   <Building size={18} /> Existing Locations
                 </h3>
                 <div className="space-y-3">
                   {locations.map(loc => (
                     <div key={loc.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-start bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-800">{loc.name}</p>
                          <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">{loc.type}</span>
                          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                             <MapPin size={12} /> {loc.address}
                          </p>
                        </div>
                        {/* Note: Delete logic is complex due to stock dependency, omitted for MVP */}
                     </div>
                   ))}
                 </div>
               </div>

               {/* Add New */}
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus size={18} /> Add New Location
                  </h3>
                  <form onSubmit={handleAddLocation} className="space-y-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location Name</label>
                       <input 
                         type="text"
                         required 
                         value={newLocName}
                         onChange={e => setNewLocName(e.target.value)}
                         className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Type</label>
                       <select 
                         value={newLocType}
                         onChange={e => setNewLocType(e.target.value as any)}
                         className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                       >
                         <option value="STORE">Retail Store</option>
                         <option value="WAREHOUSE">Warehouse</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Address</label>
                       <input 
                         type="text" 
                         required
                         value={newLocAddress}
                         onChange={e => setNewLocAddress(e.target.value)}
                         className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                       />
                     </div>
                     <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
                       Add Location
                     </button>
                  </form>
               </div>

             </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="p-6 max-w-2xl">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Database size={18} /> Data Management
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 border border-indigo-100 bg-indigo-50 rounded-lg flex items-center justify-between">
                 <div>
                   <p className="font-bold text-indigo-900">Export Inventory</p>
                   <p className="text-sm text-indigo-700">Download all your product data and stock levels as a CSV file.</p>
                 </div>
                 <button 
                   onClick={exportData}
                   className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
                 >
                   <Download size={18} />
                   Download CSV
                 </button>
              </div>

              <div className="p-4 border border-red-100 bg-red-50 rounded-lg flex items-center justify-between opacity-75">
                 <div>
                   <p className="font-bold text-red-900">Reset System Data</p>
                   <p className="text-sm text-red-700">Clear all transactions and restore default mock data. (Disabled for safety)</p>
                 </div>
                 <button disabled className="bg-white text-slate-400 border border-slate-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed">
                   <Trash2 size={18} />
                   Reset
                 </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;
