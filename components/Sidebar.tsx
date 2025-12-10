
import React from 'react';
import { LayoutDashboard, Package, Settings, Sparkles, LogOut, BarChart3, ClipboardCheck, ShoppingCart, Users, Truck } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'inventory' | 'audit' | 'reports' | 'pos' | 'suppliers' | 'orders' | 'settings';
  onChangeView: (view: 'dashboard' | 'inventory' | 'audit' | 'reports' | 'pos' | 'suppliers' | 'orders' | 'settings') => void;
  onOpenAI: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onOpenAI }) => {
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-500 p-2 rounded-lg">
          <Package className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">RIMS AI</h1>
          <p className="text-xs text-slate-400">Inventory Manager</p>
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
          onClick={() => onChangeView('reports')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <BarChart3 size={20} />
          Reports
        </button>

        <div className="pt-4 mt-4 border-t border-slate-800">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tools</p>
          <button
            onClick={onOpenAI}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors"
          >
            <Sparkles size={20} />
            Ask AI Assistant
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
           onClick={() => onChangeView('settings')}
           className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
             currentView === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
           }`}
        >
          <Settings size={20} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
