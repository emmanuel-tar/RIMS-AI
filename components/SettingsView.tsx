
import React, { useState } from 'react';
import { Save, Building, MapPin, Database, Download, Plus, Trash2, Cloud, Wifi, WifiOff, Key, Globe, LayoutGrid } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Location } from '../types';

const SettingsView: React.FC = () => {
  const { settings, updateSettings, updateCloudSettings, locations, addLocation, exportData, syncStatus, triggerSync } = useInventory();
  const [activeTab, setActiveTab] = useState<'general' | 'locations' | 'cloud' | 'data'>('general');

  // Local state for new location form
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocType, setNewLocType] = useState<'STORE' | 'WAREHOUSE'>('STORE');

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">System Settings</h2>
           <p className="text-sm text-slate-500">Configure your store profile, locations, and data preferences.</p>
        </div>
        
        {/* Marketplace Shortcut */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3">
           <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
             <LayoutGrid size={18} />
           </div>
           <div>
              <p className="text-xs font-bold text-indigo-900 uppercase">Need more features?</p>
              <p className="text-xs text-indigo-600">Visit the Marketplace to enable modules.</p>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex gap-4">
           <button 
             onClick={() => setActiveTab('general')}
             className={`pb-3 px-4 pt-3 text-sm font-medium transition-colors border-b-2 ${
               activeTab === 'general' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
           >
             General Profile
           </button>
           
           {settings.features.MULTI_LOCATION && (
             <button 
               onClick={() => setActiveTab('locations')}
               className={`pb-3 px-4 pt-3 text-sm font-medium transition-colors border-b-2 ${
                 activeTab === 'locations' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
               }`}
             >
               Locations
             </button>
           )}

           {settings.features.CLOUD && (
             <button 
               onClick={() => setActiveTab('cloud')}
               className={`pb-3 px-4 pt-3 text-sm font-medium transition-colors border-b-2 ${
                 activeTab === 'cloud' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
               }`}
             >
               Cloud & Network
             </button>
           )}

           <button 
             onClick={() => setActiveTab('data')}
             className={`pb-3 px-4 pt-3 text-sm font-medium transition-colors border-b-2 ${
               activeTab === 'data' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
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
        {activeTab === 'locations' && settings.features.MULTI_LOCATION && (
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

        {/* Cloud Tab */}
        {activeTab === 'cloud' && settings.features.CLOUD && (
           <div className="p-6 max-w-2xl space-y-8">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-4">
                 <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                    <Cloud size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-indigo-900">Head Office Connection</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                       Connect this branch to your central RIMS Cloud server to sync inventory, sales, and purchasing data in real-time.
                    </p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3 py-2">
                    <span className="text-sm font-medium text-slate-700">Connection Status:</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                       syncStatus === 'CONNECTED' ? 'bg-green-100 text-green-700' :
                       syncStatus === 'SYNCING' ? 'bg-blue-100 text-blue-700' :
                       'bg-red-100 text-red-700'
                    }`}>
                       {syncStatus === 'CONNECTED' ? <Wifi size={14} className="mr-1" /> : <WifiOff size={14} className="mr-1" />}
                       {syncStatus}
                    </span>
                    {settings.cloud?.lastSync && (
                       <span className="text-xs text-slate-400">Last synced: {new Date(settings.cloud.lastSync).toLocaleTimeString()}</span>
                    )}
                 </div>

                 <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint</label>
                       <div className="relative">
                          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                             type="text" 
                             value={settings.cloud?.apiEndpoint || ''}
                             onChange={(e) => updateCloudSettings({ apiEndpoint: e.target.value })}
                             className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                             placeholder="https://api.rims-cloud.com/v1"
                          />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Store ID</label>
                          <input 
                             type="text" 
                             value={settings.cloud?.storeId || ''}
                             onChange={(e) => updateCloudSettings({ storeId: e.target.value })}
                             className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                             placeholder="STORE-001"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                          <div className="relative">
                             <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input 
                                type="password" 
                                value={settings.cloud?.apiKey || ''}
                                onChange={(e) => updateCloudSettings({ apiKey: e.target.value })}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••••••"
                             />
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                       <input 
                          type="checkbox" 
                          id="autoSync"
                          checked={settings.cloud?.enabled || false}
                          onChange={(e) => updateCloudSettings({ enabled: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                       />
                       <label htmlFor="autoSync" className="text-sm text-slate-700">Enable Automatic Synchronization</label>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button 
                       onClick={triggerSync}
                       disabled={!settings.cloud?.enabled || syncStatus === 'SYNCING'}
                       className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                       {syncStatus === 'SYNCING' ? 'Syncing...' : 'Test Connection & Sync'}
                    </button>
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
