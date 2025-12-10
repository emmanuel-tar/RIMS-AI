
import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
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
import DashboardView from '../components/DashboardView';
import AIAssistant from '../components/AIAssistant';
import FeatureMarketplace from '../components/FeatureMarketplace';
import ActivityLogView from '../components/ActivityLogView';
import { InventoryItem } from '../types';

const Home: React.FC = () => {
  const { 
    locations, inventory, setSearchQuery, searchQuery,
    addItem, updateItem, adjustStock, currentUser, settings
  } = useInventory();
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'audit' | 'reports' | 'pos' | 'suppliers' | 'orders' | 'settings' | 'team' | 'customers' | 'marketplace' | 'activity'>('dashboard');
  const [isAIModalOpen, setAIModalOpen] = useState(false);
  
  // Modal States
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustmentMode, setAdjustmentMode] = useState(false);
  
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);

  // Global Location Filter for Dashboard/Inventory
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');

  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Ensure view resets if module disabled
  useEffect(() => {
    if (currentView === 'suppliers' && !settings.features.SUPPLIERS) setCurrentView('dashboard');
    if (currentView === 'team' && !settings.features.TEAM) setCurrentView('dashboard');
    if (currentView === 'customers' && !settings.features.CRM) setCurrentView('dashboard');
    if (currentView === 'orders' && !settings.features.SUPPLIERS) setCurrentView('dashboard');
  }, [settings.features, currentView]);

  // Handlers
  const handleEdit = (item: InventoryItem) => {
    // Only Managers/Admins can edit item details
    if (isManagerOrAdmin) {
      setEditingItem(item);
      setAdjustmentMode(false);
      setProductModalOpen(true);
    } else {
      alert("Permission denied: Only Managers can edit product details.");
    }
  };

  const handleAdjust = (item: InventoryItem) => {
    // Cashiers might be allowed to adjust for damage? For now let's restrict to Manager
    if (isManagerOrAdmin) {
      setEditingItem(item);
      setAdjustmentMode(true);
      setProductModalOpen(true);
    } else {
      alert("Permission denied: Only Managers can adjust stock.");
    }
  };

  const handleTransfer = (item: InventoryItem) => {
    if (isManagerOrAdmin) {
      setTransferItem(item);
      setTransferModalOpen(true);
    } else {
      alert("Permission denied: Only Managers can transfer stock.");
    }
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
              {currentView === 'pos' ? 'Point of Sale' : currentView.replace('activity', 'Activity Log')}
            </h1>
            <p className="text-sm text-slate-500">
              {currentView === 'dashboard' ? `Overview for ${selectedLocationId === 'all' ? 'All Locations' : locations.find(l => l.id === selectedLocationId)?.name}` : 
               currentView === 'reports' ? 'Analytics & Financial Insights' :
               currentView === 'pos' ? 'Process sales transactions' :
               currentView === 'settings' ? 'System Configuration' :
               currentView === 'team' ? 'Staff & Roles' :
               currentView === 'customers' ? 'CRM & Loyalty' :
               currentView === 'marketplace' ? 'Manage Features & Modules' :
               currentView === 'activity' ? 'Audit Trail & History' :
               'Manage your retail operations'}
            </p>
          </div>

          <div className="flex items-center gap-3">
             {/* Location Switcher - Hide on global views like Settings */}
             {!['reports', 'settings', 'suppliers', 'team', 'customers', 'marketplace', 'activity'].includes(currentView) && settings.features.MULTI_LOCATION && (
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
            
            {currentView === 'inventory' && isManagerOrAdmin && (
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
            <DashboardView onNavigate={setCurrentView} />
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
          
          {currentView === 'activity' && (
            <ActivityLogView />
          )}

          {currentView === 'reports' && settings.features.REPORTS && (
            <ReportsView />
          )}

          {currentView === 'pos' && (
            <POSView locationId={selectedLocationId} />
          )}

          {currentView === 'suppliers' && settings.features.SUPPLIERS && (
             <SuppliersView />
          )}

          {currentView === 'orders' && settings.features.SUPPLIERS && (
             <PurchaseOrdersView />
          )}

          {currentView === 'team' && settings.features.TEAM && (
             <TeamView />
          )}

          {currentView === 'customers' && settings.features.CRM && (
             <CustomersView />
          )}

          {currentView === 'settings' && (
             <SettingsView />
          )}
          
          {currentView === 'marketplace' && (
             <FeatureMarketplace />
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
