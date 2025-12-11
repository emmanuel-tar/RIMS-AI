
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Bell, AlertTriangle, X } from 'lucide-react';
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
import ExpensesView from '../components/ExpensesView';
import CommandPalette from '../components/CommandPalette'; 
import ToastContainer from '../components/ToastContainer';
import { InventoryItem } from '../types';

const Home: React.FC = () => {
  const { 
    locations, inventory, setSearchQuery, searchQuery,
    addItem, updateItem, adjustStock, currentUser, settings
  } = useInventory();
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'audit' | 'reports' | 'pos' | 'suppliers' | 'orders' | 'settings' | 'team' | 'customers' | 'marketplace' | 'activity' | 'expenses'>('dashboard');
  const [isAIModalOpen, setAIModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
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

  // Hotkey Listener for Command Palette (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ensure view resets if module disabled
  useEffect(() => {
    if (currentView === 'suppliers' && !settings.features.SUPPLIERS) setCurrentView('dashboard');
    if (currentView === 'team' && !settings.features.TEAM) setCurrentView('dashboard');
    if (currentView === 'customers' && !settings.features.CRM) setCurrentView('dashboard');
    if (currentView === 'orders' && !settings.features.SUPPLIERS) setCurrentView('dashboard');
    if (currentView === 'expenses' && !settings.features.FINANCE) setCurrentView('dashboard');
  }, [settings.features, currentView]);

  // Calculate Low Stock Items for Notifications
  const lowStockAlerts = useMemo(() => {
    return inventory.filter(item => {
        const stock = selectedLocationId === 'all' 
          ? item.stockQuantity 
          : (item.stockDistribution[selectedLocationId] || 0);
        return stock <= item.lowStockThreshold;
    });
  }, [inventory, selectedLocationId]);

  // Handlers
  const handleEdit = (item: InventoryItem) => {
    if (isManagerOrAdmin) {
      setEditingItem(item);
      setAdjustmentMode(false);
      setProductModalOpen(true);
    } else {
      alert("Permission denied: Only Managers can edit product details.");
    }
  };

  const handleAdjust = (item: InventoryItem) => {
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
       adjustStock(data.id, data.locationId, data.quantity, data.reason);
    } else if (editingItem) {
       updateItem(editingItem.id, data);
    } else {
       const { initialStock, locationId, ...itemData } = data;
       addItem(itemData, initialStock, locationId);
    }
  };

  // Determine if location selector should be shown
  const showLocationSelector = !['reports', 'settings', 'suppliers', 'team', 'customers', 'marketplace', 'activity'].includes(currentView) && settings.features.MULTI_LOCATION;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onOpenAI={() => setAIModalOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)} 
      />

      <main className="flex-1 ml-64 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 capitalize">
              {currentView === 'pos' ? 'Point of Sale' : currentView.replace('activity', 'Activity Log')}
            </h1>
            <p className="text-sm text-slate-500">
              {(currentView === 'dashboard' || currentView === 'inventory' || currentView === 'pos') && (
                <span className="font-semibold text-indigo-600 mr-1">
                  {selectedLocationId === 'all' ? 'All Locations' : locations.find(l => l.id === selectedLocationId)?.name} •
                </span>
              )}
              {currentView === 'dashboard' ? 'Overview' : 
               currentView === 'inventory' ? 'Stock Management' :
               currentView === 'reports' ? 'Analytics & Financial Insights' :
               currentView === 'pos' ? 'Process Transactions' :
               currentView === 'settings' ? 'System Configuration' :
               currentView === 'team' ? 'Staff & Roles' :
               currentView === 'customers' ? 'CRM & Loyalty' :
               currentView === 'marketplace' ? 'Manage Features & Modules' :
               currentView === 'activity' ? 'Audit Trail & History' :
               currentView === 'expenses' ? 'Cost & Expense Tracking' :
               'Manage your retail operations'}
            </p>
          </div>

          <div className="flex items-center gap-3">
             {/* Notification Bell */}
             <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                >
                   <Bell size={20} />
                   {lowStockAlerts.length > 0 && (
                     <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                   )}
                </button>

                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                       <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                          <span className="text-xs font-medium text-slate-500">{lowStockAlerts.length} Alerts</span>
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                          {lowStockAlerts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                               <p>No new alerts.</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-50">
                               {lowStockAlerts.map(item => {
                                  const stock = selectedLocationId === 'all' 
                                    ? item.stockQuantity 
                                    : (item.stockDistribution[selectedLocationId] || 0);
                                  return (
                                    <div key={item.id} className="p-3 hover:bg-slate-50 flex items-start gap-3 transition-colors">
                                       <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                                          <AlertTriangle size={16} />
                                       </div>
                                       <div>
                                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                          <p className="text-xs text-red-600 font-medium">Low Stock: {stock} remaining</p>
                                          <p className="text-xs text-slate-400 mt-0.5">Threshold: {item.lowStockThreshold}</p>
                                       </div>
                                    </div>
                                  );
                               })}
                            </div>
                          )}
                       </div>
                       {lowStockAlerts.length > 0 && (
                         <button 
                           onClick={() => {
                             setCurrentView('inventory');
                             setIsNotificationsOpen(false);
                           }}
                           className="w-full p-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors text-center"
                         >
                           View Inventory
                         </button>
                       )}
                    </div>
                  </>
                )}
             </div>

             {/* Location Switcher */}
             {showLocationSelector && (
               <div className="flex flex-col items-end">
                 {currentView === 'pos' && selectedLocationId === 'all' && (
                   <span className="text-[10px] text-amber-600 font-bold uppercase mb-0.5 animate-pulse">Select Store Location</span>
                 )}
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location:</span>
                    <select 
                        value={selectedLocationId} 
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className={`bg-white border text-sm rounded-lg block p-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 min-w-[160px] ${currentView === 'pos' && selectedLocationId === 'all' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-300 text-slate-700'}`}
                    >
                        <option value="all">All Locations</option>
                        {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                 </div>
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
            <DashboardView 
              onNavigate={setCurrentView} 
              selectedLocationId={selectedLocationId}
            />
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
          
          {currentView === 'expenses' && settings.features.FINANCE && (
             <ExpensesView />
          )}

          {currentView === 'settings' && (
             <SettingsView />
          )}
          
          {currentView === 'marketplace' && (
             <FeatureMarketplace />
          )}

        </div>
      </main>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={setCurrentView}
        onAction={(action) => {
           if(action === 'ADD_PRODUCT') handleAddNew();
        }}
      />

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

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Home;
