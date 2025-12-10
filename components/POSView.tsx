
import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, CheckCircle, PackageX } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { InventoryItem, Category } from '../types';

interface CartItem extends InventoryItem {
  cartQty: number;
}

const POSView: React.FC<{ locationId: string }> = ({ locationId }) => {
  const { inventory, locations, processSale } = useInventory();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showSuccess, setShowSuccess] = useState(false);

  // If locationId is 'all', default to the first location for sales logic
  const activeLocationId = locationId === 'all' ? locations[0]?.id : locationId;
  const activeLocationName = locations.find(l => l.id === activeLocationId)?.name || 'Unknown Location';

  // Filter products
  const products = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventory, search, activeCategory]);

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, cartQty: i.cartQty + 1 } : i);
      }
      return [...prev, { ...item, cartQty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, cartQty: Math.max(1, item.cartQty + delta) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.cartQty), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    processSale(
      activeLocationId,
      cart.map(i => ({ itemId: i.id, quantity: i.cartQty }))
    );
    
    setCart([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Left: Product Catalog */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Scan barcode or search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <select 
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              {Object.values(Category).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(item => {
               const stock = item.stockDistribution[activeLocationId] || 0;
               return (
                 <button
                   key={item.id}
                   onClick={() => addToCart(item)}
                   className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left group flex flex-col h-full"
                 >
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{item.category}</span>
                     <span className={`text-xs font-medium ${stock <= item.lowStockThreshold ? 'text-red-500' : 'text-green-600'}`}>
                        {stock} in stock
                     </span>
                   </div>
                   <h3 className="font-semibold text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 line-clamp-2 flex-1">
                     {item.name}
                   </h3>
                   <p className="text-xs text-slate-400 mb-3">{item.sku}</p>
                   <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">${item.sellingPrice.toFixed(2)}</span>
                      <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={16} />
                      </div>
                   </div>
                 </button>
               );
            })}
            {products.length === 0 && (
               <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                  <PackageX size={48} className="mb-2 opacity-50" />
                  <p>No products found matching your search.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart/Register */}
      <div className="w-96 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="p-4 bg-slate-900 text-white shadow-md">
           <h2 className="font-bold flex items-center gap-2">
             <ShoppingCart size={18} />
             Current Sale
           </h2>
           <p className="text-xs text-slate-400 mt-1">
             Location: <span className="text-white font-medium">{activeLocationName}</span>
           </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                 <ShoppingCart size={32} className="opacity-20 text-slate-900" />
               </div>
               <p className="text-sm">Scan an item or select from list to start a sale.</p>
             </div>
           ) : (
             cart.map(item => (
               <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                  <div className="flex-1">
                     <p className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</p>
                     <p className="text-xs text-slate-500 mb-2">{item.sku}</p>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQty(item.id, -1)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.cartQty}</span>
                        <button 
                          onClick={() => updateQty(item.id, 1)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500"
                        >
                          <Plus size={14} />
                        </button>
                     </div>
                  </div>
                  <div className="flex flex-col justify-between items-end">
                     <p className="font-bold text-slate-900">${(item.sellingPrice * item.cartQty).toFixed(2)}</p>
                     <button 
                       onClick={() => removeFromCart(item.id)}
                       className="text-red-400 hover:text-red-600 p-1"
                     >
                       <Trash2 size={14} />
                     </button>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Totals Section */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
           <div className="flex justify-between text-sm text-slate-600">
             <span>Subtotal</span>
             <span>${cartTotal.toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-sm text-slate-600">
             <span>Tax (0%)</span>
             <span>$0.00</span>
           </div>
           <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
             <span>Total</span>
             <span>${cartTotal.toFixed(2)}</span>
           </div>
           
           <div className="grid grid-cols-2 gap-3 pt-2">
             <button 
               onClick={handleCheckout}
               disabled={cart.length === 0}
               className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
             >
               <CreditCard size={18} /> Card
             </button>
             <button 
               onClick={handleCheckout}
               disabled={cart.length === 0}
               className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
             >
               <Banknote size={18} /> Cash
             </button>
           </div>
        </div>

        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
             <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
             <h3 className="text-2xl font-bold text-slate-900">Sale Completed!</h3>
             <p className="text-slate-500">Transaction recorded successfully.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSView;
