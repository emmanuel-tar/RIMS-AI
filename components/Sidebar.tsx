
import React from 'react';
import { LayoutDashboard, Package, Settings, Sparkles, LogOut, BarChart3, ClipboardCheck, ShoppingCart, Users, Truck, Contact, Wifi, WifiOff, RefreshCw, LayoutGrid, History } from 'lucide-react';
import { useInventory } from '../context/ShopContext';

interface SidebarProps {
  currentView: 'dashboard' | 'inventory' | 'audit' | 'reports' | 'pos' | 'suppliers' | 'orders' | 'settings' | 'team' | 'customers' | 'marketplace' | 'activity';
  onChangeView: (view: any) => void;
  onOpenAI: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onOpenAI }) => {
  const { currentUser, logout, syncStatus, settings, triggerSync } = useInventory();
  
  const isManagerOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const { features } = settings;

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <Package className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">RIMS AI</h1>
          <p className="text-xs text-slate-400">
            {currentUser?.name || 'Guest'}
            <span className="block text-[10px] text-indigo-300 font-semibold mt-0.5">{currentUser?.role}</span>
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        <button
          onClick={() => onChangeView('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard size={20} />
          Dashboard
        </button>

        <button
          onClick={() => onChangeView('pos')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'pos' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShoppingCart size={20} />
          Point of Sale
        </button>
        
        <button
          onClick={() => onChangeView('inventory')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'inventory' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Package size={20} />
          Inventory List
        </button>

        {features.CRM && (
          <button
            onClick={() => onChangeView('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'customers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Contact size={20} />
            Customers
          </button>
        )}

        {isManagerOrAdmin && (
          <>
            {features.SUPPLIERS && (
              <>
                <button
                  onClick={() => onChangeView('suppliers')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'suppliers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users size={20} />
                  Suppliers
                </button>

                <button
                  onClick={() => onChangeView('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Truck size={20} />
                  Purchase Orders
                </button>
              </>
            )}

            <button
              onClick={() => onChangeView('audit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardCheck size={20} />
              Stock Audit
            </button>
            
            <button
              onClick={() => onChangeView('activity')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'activity' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History size={20} />
              Activity Log
            </button>

            {features.REPORTS && (
              <button
                onClick={() => onChangeView('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 size={20} />
                Reports
              </button>
            )}
          </>
        )}

        {isAdmin && features.TEAM && (
           <button
            onClick={() => onChangeView('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'team' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={20} />
            Team
          </button>
        )}

        <div className="pt-4 mt-4 border-t border-slate-800">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tools</p>
          
          {features.AI_ASSISTANT && (
            <button
              onClick={onOpenAI}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors"
            >
              <Sparkles size={20} />
              Ask AI Assistant
            </button>
          )}

          {isAdmin && (
             <button 
               onClick={() => onChangeView('marketplace')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                 currentView === 'marketplace' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
               }`}
            >
              <LayoutGrid size={20} />
              Modules
            </button>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        {/* Status Indicator */}
        {features.CLOUD && (
          <div className="flex items-center justify-between mb-3 px-2">
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                {syncStatus === 'CONNECTED' ? (
                  <Wifi size={14} className="text-green-500" />
                ) : syncStatus === 'SYNCING' ? (
                  <RefreshCw size={14} className="text-blue-500 animate-spin" />
                ) : (
                  <WifiOff size={14} className="text-red-500" />
                )}
                {syncStatus}
             </div>
             {settings.cloud?.enabled && (
               <button onClick={triggerSync} className="text-slate-500 hover:text-white">
                 <RefreshCw size={14} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} />
               </button>
             )}
          </div>
        )}

        {isAdmin && (
           <button 
             onClick={() => onChangeView('settings')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
               currentView === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
             }`}
          >
            <Settings size={20} />
            Settings
          </button>
        )}
        <button 
           onClick={logout}
           className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
