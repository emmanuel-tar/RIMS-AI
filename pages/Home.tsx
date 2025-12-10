
import React, { useState, useMemo } from 'react';
import { Plus, Search, AlertCircle, ArrowUpRight, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import Sidebar from '../components/Sidebar';
import InventoryTable from '../components/InventoryTable';
import ProductModal from '../components/ProductModal';
import TransferModal from '../components/TransferModal';
import AuditView from '../components/AuditView';
import ReportsView from '../components/ReportsView';
import POSView from '../components/POSView';
import SuppliersView from '../components/SuppliersView';
import PurchaseOrdersView from '../components/PurchaseOrdersView';
import TeamView from '../components/TeamView';
import CustomersView from '../components/CustomersView';
import SettingsView from '../components/SettingsView';
import AIAssistant from '../components/AIAssistant';
import { InventoryItem } from '../types';

const Home: React.FC = () => {
  const { 
    stats, locations, inventory, setSearchQuery, searchQuery,
    addItem, updateItem, adjustStock 
  } = useInventory();
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'audit' | 'reports' | 'pos' | 'suppliers' | 'orders' | 'settings' | 'team' | 'customers'>('dashboard');
  const [isAIModalOpen, setAIModalOpen] = useState(false);
  
  // Modal States
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustmentMode, setAdjustmentMode] = useState(false);
  
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);

  // Global Location Filter for Dashboard/Inventory
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');

  // Calculate Low Stock Items based on selected Location
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => {
      const stock = selectedLocationId === 'all' 
        ? item.stockQuantity 
        : (item.stockDistribution[selectedLocationId] || 0);
      return stock <= item.lowStockThreshold;
    });
  }, [inventory, selectedLocationId]);

  // Handlers
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setAdjustmentMode(false);
    setProductModalOpen(true);
  };

  const handleAdjust = (item: InventoryItem) => {
    setEditingItem(item);
    setAdjustmentMode(true);
    setProductModalOpen(true);
  };

  const handleTransfer = (item: InventoryItem) => {
    setTransferItem(item);
    setTransferModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setAdjustmentMode(false);
    setProductModalOpen(true);
  };

  const handleProductSubmit = (data: any) => {
    if (isAdjustmentMode && editingItem) {
       // Adjustment Mode
       adjustStock(data.id, data.locationId, data.quantity, data.reason);
    } else if (editingItem) {
       // Edit Mode
       updateItem(editingItem.id, data);
    } else {
       // Create Mode
       const { initialStock, locationId, ...itemData } = data;
       addItem(itemData, initialStock, locationId);
    }
  };

  const currentLowStockCount = lowStockItems.length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onOpenAI={() => setAIModalOpen(true)}
      />

      <main className="flex-1 ml-64 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 capitalize">
              {currentView === 'pos' ? 'Point of Sale' : currentView}
            </h1>
            <p className="text-sm text-slate-500">
              {currentView === 'dashboard' ? `Overview for ${selectedLocationId === 'all' ? 'All Locations' : locations.find(l => l.id === selectedLocationId)?.name}` : 
               currentView === 'reports' ? 'Analytics & Financial Insights' :
               currentView === 'pos' ? 'Process sales transactions' :
               currentView === 'settings' ? 'System Configuration' :
               currentView === 'team' ? 'Staff & Roles' :
               currentView === 'customers' ? 'CRM & Loyalty' :
               'Manage your retail operations'}
            </p>
          </div>

          <div className="flex items-center gap-3">
             {/* Location Switcher - Hide on global views like Settings */}
             {!['reports', 'settings', 'suppliers', 'team', 'customers'].includes(currentView) && (
               <div className="flex flex-col items-end">
                 {currentView === 'pos' && selectedLocationId === 'all' && (
                   <span className="text-[10px] text-amber-600 font-bold uppercase mb-0.5 animate-pulse">Select Store Location</span>
                 )}
                 <select 
                    value={selectedLocationId} 
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className={`bg-white border text-sm rounded-lg block p-2.5 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${currentView === 'pos' && selectedLocationId === 'all' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-300 text-slate-700'}`}
                  >
                    <option value="all">All Locations</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
               </div>
             )}

            {currentView === 'inventory' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm"
                />
              </div>
            )}
            
            {currentView === 'inventory' && (
              <button 
                onClick={handleAddNew}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Add Product
              </button>
            )}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8 h-full">
          
          {currentView === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Inventory Value</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">
                      ${stats.totalValue.toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-green-600">
                    <DollarSign size={20} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                   <div>
                    <p className="text-sm font-medium text-slate-500">Total Items</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">
                      {stats.totalItems}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    <Package size={20} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                   <div>
                    <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
                    <h3 className={`text-2xl font-bold mt-2 ${currentLowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      {currentLowStockCount}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-lg ${currentLowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                    <AlertTriangle size={20} />
                  </div>
                </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                   <div>
                    <p className="text-sm font-medium text-slate-500">Categories</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-2">
                      {stats.categories}
                    </h3>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Section */}
              {lowStockItems.length > 0 && (
                <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                   <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={20} />
                        <h3 className="font-semibold text-slate-800">Items Needing Attention</h3>
                      </div>
                      <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        {lowStockItems.length} items below threshold
                      </span>
                   </div>
                   <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                      {lowStockItems.map(item => {
                         const currentStock = selectedLocationId === 'all' 
                           ? item.stockQuantity 
                           : (item.stockDistribution[selectedLocationId] || 0);

                         return (
                           <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                 <div>
                                    <p className="font-medium text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8">
                                 <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase">Stock / Limit</p>
                                    <p className="font-semibold text-slate-800">
                                      <span className="text-red-600">{currentStock}</span>
                                      <span className="text-slate-400 text-xs mx-1">/</span> 
                                      {item.lowStockThreshold}
                                    </p>
                                 </div>
                                 <button 
                                   onClick={() => handleAdjust(item)}
                                   className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                                 >
                                   Restock
                                 </button>
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </div>
              )}
            </>
          )}

          {currentView === 'inventory' && (
            <InventoryTable 
              onEdit={handleEdit} 
              onAdjust={handleAdjust}
              onTransfer={handleTransfer}
              selectedLocationId={selectedLocationId}
            />
          )}

          {currentView === 'audit' && (
            <AuditView />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'pos' && (
            <POSView locationId={selectedLocationId} />
          )}

          {currentView === 'suppliers' && (
             <SuppliersView />
          )}

          {currentView === 'orders' && (
             <PurchaseOrdersView />
          )}

          {currentView === 'team' && (
             <TeamView />
          )}

          {currentView === 'customers' && (
             <CustomersView />
          )}

          {currentView === 'settings' && (
             <SettingsView />
          )}

        </div>
      </main>

      {/* Modals */}
      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSubmit={handleProductSubmit}
        initialData={editingItem}
        isAdjustment={isAdjustmentMode}
      />

      <TransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        item={transferItem}
      />

      <AIAssistant 
        isOpen={isAIModalOpen}
        onClose={() => setAIModalOpen(false)}
      />
    </div>
  );
};

export default Home;
