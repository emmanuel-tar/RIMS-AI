
import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight, Package, Users, ShoppingCart, Settings, Plus, FileText, LayoutDashboard, Truck } from 'lucide-react';
import { useInventory } from '../context/ShopContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: any) => void;
  onAction: (action: string) => void;
}

type ResultType = 'NAVIGATION' | 'ACTION' | 'PRODUCT' | 'CUSTOMER';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onAction }) => {
  const { inventory, customers, settings } = useInventory();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const results: SearchResult[] = [];

  // 1. Navigation Commands
  if (!query || 'dashboard'.includes(query.toLowerCase())) {
    results.push({ id: 'nav-dash', type: 'NAVIGATION', title: 'Go to Dashboard', icon: <LayoutDashboard size={18} />, action: () => onNavigate('dashboard') });
  }
  if (!query || 'point of sale pos'.includes(query.toLowerCase())) {
    results.push({ id: 'nav-pos', type: 'NAVIGATION', title: 'Go to Point of Sale', icon: <ShoppingCart size={18} />, action: () => onNavigate('pos') });
  }
  if (!query || 'inventory stock'.includes(query.toLowerCase())) {
    results.push({ id: 'nav-inv', type: 'NAVIGATION', title: 'Go to Inventory', icon: <Package size={18} />, action: () => onNavigate('inventory') });
  }
  if (!query || 'settings config'.includes(query.toLowerCase())) {
    results.push({ id: 'nav-set', type: 'NAVIGATION', title: 'Go to Settings', icon: <Settings size={18} />, action: () => onNavigate('settings') });
  }

  // 2. Global Actions
  if (!query || 'add new product item'.includes(query.toLowerCase())) {
    results.push({ id: 'act-add-prod', type: 'ACTION', title: 'Add New Product', icon: <Plus size={18} />, action: () => onAction('ADD_PRODUCT') });
  }
  if ((!query || 'add customer'.includes(query.toLowerCase())) && settings.features.CRM) {
    results.push({ id: 'act-add-cust', type: 'ACTION', title: 'Add New Customer', icon: <Users size={18} />, action: () => onNavigate('customers') }); // Simply nav for now
  }
  if ((!query || 'create purchase order'.includes(query.toLowerCase())) && settings.features.SUPPLIERS) {
    results.push({ id: 'act-create-po', type: 'ACTION', title: 'Create Purchase Order', icon: <Truck size={18} />, action: () => onNavigate('orders') });
  }

  // 3. Search Data (Only if query exists)
  if (query.length > 1) {
    const lowerQuery = query.toLowerCase();
    
    // Inventory
    inventory.slice(0, 5).forEach(item => {
      if (item.name.toLowerCase().includes(lowerQuery) || item.sku.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `prod-${item.id}`,
          type: 'PRODUCT',
          title: item.name,
          subtitle: `SKU: ${item.sku} • $${item.sellingPrice}`,
          icon: <Package size={18} className="text-indigo-500" />,
          action: () => {
             onNavigate('inventory');
             // In a real app, this would also set a focus/filter on the table
          }
        });
      }
    });

    // Customers
    if (settings.features.CRM) {
      customers.slice(0, 3).forEach(cust => {
        if (cust.name.toLowerCase().includes(lowerQuery) || cust.phone.includes(lowerQuery)) {
          results.push({
            id: `cust-${cust.id}`,
            type: 'CUSTOMER',
            title: cust.name,
            subtitle: cust.phone,
            icon: <Users size={18} className="text-green-500" />,
            action: () => onNavigate('customers')
          });
        }
      });
    }
  }

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ring-1 ring-slate-900/5">
        
        {/* Input Area */}
        <div className="flex items-center px-4 border-b border-slate-100 p-4">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
             <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-md">Esc</kbd>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
               <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="px-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => {
                    result.action();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    index === selectedIndex ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`p-2 rounded-md ${
                    index === selectedIndex ? 'bg-white shadow-sm text-indigo-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {result.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${index === selectedIndex ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className={`text-xs ${index === selectedIndex ? 'text-indigo-500' : 'text-slate-500'}`}>
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  {index === selectedIndex && (
                     <ArrowRight size={16} className="text-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
           <span>
              <strong>Pro Tip:</strong> Use <kbd className="font-sans border px-1 rounded bg-white">↑</kbd> <kbd className="font-sans border px-1 rounded bg-white">↓</kbd> to navigate
           </span>
           <span>RIMS Command Center</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
