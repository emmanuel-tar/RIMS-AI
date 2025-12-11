
import React, { useState } from 'react';
import { Save, Building, MapPin, Database, Download, Plus, Trash2, Cloud, Wifi, WifiOff, Key, LayoutGrid, Server, Printer, Scan, Monitor, Tag, FileText, Image as ImageIcon, DollarSign, CheckCircle } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Location } from '../types';
import { SUPPORTED_CURRENCIES, MOCK_PRINTERS } from '../constants';

const SettingsView: React.FC = () => {
  const { settings, updateSettings, updateCloudSettings, locations, addLocation, exportData, syncStatus, triggerSync, serverUrl, setServerUrl, isLocalServerConnected, deferredPrompt, installApp } = useInventory();
  const [activeTab, setActiveTab] = useState<'general' | 'locations' | 'cloud' | 'printing' | 'data'>('general');
  const [printTab, setPrintTab] = useState<'printer_setup' | 'label_design'>('printer_setup');

  // Local state for new location form
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocType, setNewLocType] = useState<'STORE' | 'WAREHOUSE'>('STORE');
  const [localServerIp, setLocalServerIp] = useState(serverUrl);

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

  const handleSaveNetwork = () => {
    setServerUrl(localServerIp);
    alert("Server URL Updated. The app will reload to connect.");
  };
  
  const updateHardware = (key: keyof typeof settings.hardware, value: any) => {
      updateSettings({
          hardware: { ...settings.hardware, [key]: value }
      });
  };

  const updateReceipt = (key: keyof typeof settings.receiptTemplate, value: any) => {
      updateSettings({
          receiptTemplate: { ...settings.receiptTemplate, [key]: value }
      });
  };

  const updateLabel = (key: keyof typeof settings.labelTemplate, value: any) => {
      updateSettings({
          labelTemplate: { ...settings.labelTemplate, [key]: value }
      });
  };

  const handleCurrencyChange = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (currency) {
      updateSettings({
        currencyCode: currency.code,
        currencySymbol: currency.symbol
      });
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

           <button 
             onClick={() => setActiveTab('printing')}
             className={`pb-3 px-4 pt-3 text-sm font-medium transition-colors border-b-2 ${
               activeTab === 'printing' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
           >
             Business & Printer Settings
           </button>

           <button 
             onClick={() => setActiveTab('cloud')}
             className={`pb-3 px-4 pt-3 text-sm font-medium transition-colors border-b-2 ${
               activeTab === 'cloud' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'
             }`}
           >
             Cloud & Network
           </button>

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
                     <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                     <select 
                       value={settings.currencyCode}
                       onChange={(e) => handleCurrencyChange(e.target.value)}
                       className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                     >
                       {SUPPORTED_CURRENCIES.map(curr => (
                         <option key={curr.code} value={curr.code}>
                           {curr.code} - {curr.name} ({curr.symbol})
                         </option>
                       ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Default Tax Rate</label>
                     <div className="flex items-center gap-2">
                       <input 
                         type="number"
                         step="0.001" 
                         value={settings.taxRate}
                         onChange={(e) => updateSettings({ taxRate: parseFloat(e.target.value) })}
                         className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                       />
                       <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
                         {(settings.taxRate * 100).toFixed(1)}%
                       </span>
                     </div>
                     <p className="text-xs text-slate-500 mt-1">Enter as decimal (e.g. 0.075 for 7.5%). Applied to subtotal.</p>
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

             <div className="flex gap-3">
               <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2">
                 <Save size={18} />
                 Save Changes
               </button>
               
               {/* Install PWA Button */}
               {deferredPrompt && (
                 <button 
                   type="button" 
                   onClick={installApp} 
                   className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2"
                 >
                   <Monitor size={18} />
                   Install App to Desktop
                 </button>
               )}
             </div>
          </form>
        )}

        {/* Printing & Templates Tab */}
        {activeTab === 'printing' && (
          <div className="flex flex-col h-full p-6">
             <div className="flex gap-4 mb-6 bg-slate-50 p-1.5 rounded-lg w-fit border border-slate-200">
               <button 
                 onClick={() => setPrintTab('printer_setup')}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${printTab === 'printer_setup' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
               >
                 Printer & Business Setup
               </button>
               <button 
                 onClick={() => setPrintTab('label_design')}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${printTab === 'label_design' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
               >
                 Barcode Label Design
               </button>
             </div>

             {printTab === 'printer_setup' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Printer Options Grid */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Printer Options</h3>
                    <p className="text-sm text-slate-500 mb-4">Select the default printer for your receipts.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {MOCK_PRINTERS.map(printer => (
                         <div 
                           key={printer.id}
                           onClick={() => updateHardware('selectedPrinterId', printer.id)}
                           className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${
                             settings.hardware.selectedPrinterId === printer.id 
                               ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]' 
                               : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                           }`}
                         >
                            <img src={printer.image} alt={printer.name} className="w-16 h-16 object-contain opacity-80" />
                            <p className={`text-xs font-semibold text-center leading-tight ${settings.hardware.selectedPrinterId === printer.id ? 'text-indigo-900' : 'text-slate-600'}`}>
                              {printer.name}
                            </p>
                            {settings.hardware.selectedPrinterId === printer.id && (
                              <div className="absolute top-2 right-2 text-indigo-600">
                                <CheckCircle size={16} fill="currentColor" className="text-white" />
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                    <div className="flex justify-end mt-4">
                       <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 flex items-center gap-2">
                         <Printer size={16} /> Test Print
                       </button>
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                     <h3 className="text-lg font-bold text-slate-800 mb-6">Additional Settings</h3>
                     
                     <div className="space-y-6 max-w-3xl">
                        {/* Auto Print */}
                        <div className="flex items-center justify-between">
                           <div>
                             <p className="font-medium text-slate-900">Auto print on checkout</p>
                             <p className="text-xs text-slate-500">Automatically print receipt after every completed sale.</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.hardware.autoPrintReceipt} 
                                onChange={e => updateHardware('autoPrintReceipt', e.target.checked)} 
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                           </label>
                        </div>

                        {/* A4 Printer */}
                        <div className="flex items-center justify-between">
                           <div>
                             <p className="font-medium text-slate-900">Use A4 Printer for Receipts</p>
                             <p className="text-xs text-slate-500">Format receipts for standard document printers instead of thermal rolls.</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.hardware.useA4Printer || false} 
                                onChange={e => updateHardware('useA4Printer', e.target.checked)} 
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                           </label>
                        </div>

                        {/* Receipt Count */}
                        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                           <p className="font-medium text-slate-900">Receipt Copies</p>
                           <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                              {[1, 2, 3].map(num => (
                                <button
                                  key={num}
                                  onClick={() => updateHardware('receiptCopies', num)}
                                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                                    (settings.hardware.receiptCopies || 1) === num 
                                      ? 'bg-indigo-100 text-indigo-700 shadow-sm' 
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  {num} {num === 1 ? 'Receipt' : 'Receipts'}
                                </button>
                              ))}
                           </div>
                        </div>

                        {/* Kitchen Print */}
                        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                           <div>
                             <p className="font-medium text-slate-900">Auto print on kitchen display order</p>
                             <p className="text-xs text-slate-500">Send order details to kitchen printer automatically.</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={settings.hardware.autoPrintKitchen || false} 
                                onChange={e => updateHardware('autoPrintKitchen', e.target.checked)} 
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                           </label>
                        </div>

                        {/* Content Toggles */}
                        <div className="space-y-4 border-t border-slate-200 pt-4">
                           <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Receipt Content</h4>
                           
                           {[
                             { label: 'Include Address', key: 'includeAddress' },
                             { label: 'Include Phone', key: 'includePhone' },
                             { label: 'Include Store Name', key: 'includeName' },
                             { label: 'Include Logo', key: 'showLogo' },
                           ].map((item) => (
                             <div key={item.key} className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={(settings.receiptTemplate as any)[item.key]} 
                                      onChange={e => updateReceipt(item.key, e.target.checked)} 
                                      className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                             </div>
                           ))}
                        </div>

                        {/* Footer Text */}
                        <div className="pt-4 border-t border-slate-200">
                           <label className="block text-sm font-medium text-slate-700 mb-1">Footer / Last Line</label>
                           <input 
                             type="text" 
                             value={settings.receiptTemplate.footerText} 
                             onChange={e => updateReceipt('footerText', e.target.value)} 
                             className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                             placeholder="Thank you for your patronage!"
                           />
                        </div>

                        <div className="flex justify-end pt-4">
                           <button 
                             onClick={() => alert("Settings Saved!")}
                             className="bg-indigo-900 hover:bg-indigo-800 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all"
                           >
                             Save
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {printTab === 'label_design' && (
                <div className="flex flex-col md:flex-row h-full gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                   <div className="md:w-1/2 space-y-6">
                      <div className="space-y-4">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           <Tag size={18} /> Label Layout
                         </h3>
                         <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Paper / Roll Size</label>
                           <select 
                             value={settings.labelTemplate.size} 
                             onChange={(e) => updateLabel('size', e.target.value)}
                             className="w-full text-sm px-3 py-2 border rounded-lg"
                           >
                              <option value="2x1-roll">2" x 1" Thermal Roll (Standard)</option>
                              <option value="1x1-roll">1" x 1" Small Thermal</option>
                              <option value="30-up-sheet">Letter Sheet (30-up / Avery 5160)</option>
                           </select>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           <Scan size={18} /> Data Fields
                         </h3>
                         <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" checked={settings.labelTemplate.showName} onChange={e => updateLabel('showName', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                               <span className="text-sm text-slate-700">Product Name</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" checked={settings.labelTemplate.showPrice} onChange={e => updateLabel('showPrice', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                               <span className="text-sm text-slate-700">Price</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" checked={settings.labelTemplate.showSKU} onChange={e => updateLabel('showSKU', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                               <span className="text-sm text-slate-700">SKU Code</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input type="checkbox" checked={settings.labelTemplate.showBarcode} onChange={e => updateLabel('showBarcode', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                               <span className="text-sm text-slate-700">Barcode Visual</span>
                            </label>
                         </div>
                      </div>
                   </div>

                   <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col items-center justify-center rounded-xl border border-slate-200">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Label Preview</h3>
                      <div className={`bg-white border border-slate-300 shadow-sm flex flex-col items-center justify-center text-center p-2 overflow-hidden relative ${
                         settings.labelTemplate.size === '1x1-roll' ? 'w-24 h-24' : 'w-48 h-24'
                      }`}>
                         {settings.labelTemplate.showName && <div className="font-bold text-[10px] leading-tight mb-1">Sample Product Name</div>}
                         {settings.labelTemplate.showBarcode && <div className="font-barcode text-2xl leading-none">*SKU-123*</div>}
                         <div className="flex justify-between w-full px-2 mt-1 items-end absolute bottom-1 left-0">
                            {settings.labelTemplate.showSKU && <span className="text-[8px] font-semibold">SKU-123</span>}
                            {settings.labelTemplate.showPrice && <span className="text-xs font-bold">{settings.currencySymbol}2500.00</span>}
                         </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-4">Actual print quality depends on printer DPI.</p>
                   </div>
                </div>
             )}
          </div>
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
        {activeTab === 'cloud' && (
           <div className="p-6 max-w-2xl space-y-8">
              {/* Local Network Config */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-start gap-4">
                 <div className="bg-slate-200 p-2 rounded-full text-slate-600">
                    <Server size={24} />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-slate-900">Local Network Server</h3>
                    <p className="text-sm text-slate-600 mt-1 mb-3">
                       Enter the IP Address of the main computer hosting the database (e.g., http://192.168.1.5:3001/api).
                    </p>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={localServerIp}
                         onChange={(e) => setLocalServerIp(e.target.value)}
                         className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                         placeholder="http://localhost:3001/api"
                       />
                       <button 
                         onClick={handleSaveNetwork}
                         className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                       >
                         Connect
                       </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${isLocalServerConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                       <span className="text-xs font-medium text-slate-500">
                         {isLocalServerConnected ? 'Database Connected' : 'Running in Offline Mode (Browser Storage)'}
                       </span>
                    </div>
                 </div>
              </div>

              {settings.features.CLOUD && (
                <div className="space-y-4 pt-4 border-t border-slate-100 opacity-75">
                   <div className="flex items-center gap-2 mb-2">
                     <Cloud size={18} className="text-indigo-600" />
                     <h3 className="font-bold text-indigo-900">Cloud Sync (SaaS)</h3>
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint</label>
                       <input 
                           type="text" 
                           value={settings.cloud?.apiEndpoint || ''}
                           onChange={(e) => updateCloudSettings({ apiEndpoint: e.target.value })}
                           className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                           placeholder="https://api.rims-cloud.com/v1"
                       />
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
                          <input 
                                type="password" 
                                value={settings.cloud?.apiKey || ''}
                                onChange={(e) => updateCloudSettings({ apiKey: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••••••"
                             />
                       </div>
                   </div>
                   <button disabled className="mt-2 px-6 py-2 bg-indigo-100 text-indigo-400 rounded-lg font-medium cursor-not-allowed">
                       Sync Feature Coming Soon
                   </button>
                </div>
              )}
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
