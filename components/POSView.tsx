
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Receipt, User, Tag, X, Zap, Check } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { InventoryItem, Category } from '../types';
import ReceiptModal from './ReceiptModal';

interface CartItem extends InventoryItem {
  cartQty: number;
}

const POSView: React.FC<{ locationId: string }> = ({ locationId }) => {
  const { inventory, locations, processSale, customers, getPriceForLocation, settings, transactions } = useInventory();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Checkout State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // Receipt State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    items: { name: string; sku: string; qty: number; price: number }[];
    subtotal: number;
    discount: number;
    total: number;
    customer?: string;
  } | null>(null);

  // Visual Feedback State
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  // If locationId is 'all', default to the first location for sales logic
  const activeLocationId = locationId === 'all' ? locations[0]?.id : locationId;
  const activeLocationName = locations.find(l => l.id === activeLocationId)?.name || 'Unknown Location';
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Calculate Frequently Purchased Items (Top Sellers)
  const topSellers = useMemo(() => {
    const salesCounts: Record<string, number> = {};
    
    // Aggregate sales quantities from transaction history
    transactions.forEach(t => {
      if (t.type === 'SALE') {
        salesCounts[t.itemId] = (salesCounts[t.itemId] || 0) + t.quantity;
      }
    });

    // Map to inventory items, sort by count, take top 6
    return inventory
      .map(item => ({ ...item, salesCount: salesCounts[item.id] || 0 }))
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 6);
  }, [transactions, inventory]);

  // Filter products for the main grid
  const products = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventory, search, activeCategory]);

  const addToCart = (item: InventoryItem) => {
    // Trigger Feedback Animation
    setAddedFeedbackId(item.id);
    setTimeout(() => setAddedFeedbackId(null), 500);

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

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const price = getPriceForLocation(item, activeLocationId);
    return acc + (price * item.cartQty);
  }, 0);
  
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;
  const loyaltyPointsEarned = Math.floor(total / (settings.loyaltyEarnRate || 1));

  const finalizeSale = (paymentMethod: 'CARD' | 'CASH') => {
    if (cart.length === 0) return;
    
    // Create Receipt Data Snapshot
    const receiptData = {
      id: `TX-${Date.now()}`, // Temporary ID until context returns one, but processSale returns Transaction
      items: cart.map(i => ({
        name: i.name,
        sku: i.sku,
        qty: i.cartQty,
        price: getPriceForLocation(i, activeLocationId)
      })),
      subtotal,
      discount: discountAmount,
      total,
      customer: selectedCustomer?.name
    };

    const transaction = processSale(
      activeLocationId,
      cart.map(i => ({ itemId: i.id, quantity: i.cartQty })),
      selectedCustomerId || undefined,
      discountPercent > 0 ? discountPercent : undefined
    );
    
    receiptData.id = transaction.id;
    setLastTransaction(receiptData);
    
    // Close modal & Reset
    setIsCheckoutModalOpen(false);
    setCart([]);
    setSelectedCustomerId('');
    setDiscountPercent(0);
    
    // Open Receipt
    setIsReceiptOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      {/* Left: Product Catalog */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          
          {/* Quick Keys (Top Sellers) */}
          {topSellers.length > 0 && activeCategory === 'All' && !search && (
            <div className="pb-2">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                <Zap size={14} fill="currentColor" />
                Quick Keys
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {topSellers.map(item => {
                  const price = getPriceForLocation(item, activeLocationId);
                  return (
                    <button
                      key={`quick-${item.id}`}
                      onClick={() => addToCart(item)}
                      className="flex-shrink-0 w-32 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg p-3 text-left transition-all relative overflow-hidden group active:scale-95"
                    >
                      {/* Feedback Overlay for Quick Key */}
                      {addedFeedbackId === item.id && (
                        <div className="absolute inset-0 bg-green-500/90 z-10 flex items-center justify-center text-white animate-in fade-in duration-200">
                          <Check size={20} className="stroke-[3]" />
                        </div>
                      )}
                      <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                      <p className="text-indigo-600 font-bold text-xs mt-1">${price.toFixed(2)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
               const price = getPriceForLocation(item, activeLocationId);
               const isRecentlyAdded = addedFeedbackId === item.id;
               
               return (
                 <button
                   key={item.id}
                   onClick={() => addToCart(item)}
                   className={`bg-white p-4 rounded-xl border transition-all text-left group flex flex-col h-full relative overflow-hidden active:scale-95 duration-100 ${
                     isRecentlyAdded ? 'border-green-500 ring-2 ring-green-100' : 'border-slate-200 hover:border-indigo-500 hover:shadow-md'
                   }`}
                 >
                   {/* Feedback Overlay */}
                   {isRecentlyAdded && (
                      <div className="absolute inset-0 bg-green-50/80 z-10 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in duration-200">
                         <div className="bg-white rounded-full p-2 shadow-lg transform scale-125">
                            <Check size={24} className="text-green-600 stroke-[3]" />
                         </div>
                      </div>
                   )}

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
                      <span className="text-lg font-bold text-slate-900">${price.toFixed(2)}</span>
                      <div className={`p-1.5 rounded-lg transition-all ${
                         isRecentlyAdded ? 'bg-green-500 text-white' : 'bg-indigo-50 text-indigo-600 opacity-0 group-hover:opacity-100'
                      }`}>
                        {isRecentlyAdded ? <Check size={16} /> : <Plus size={16} />}
                      </div>
                   </div>
                 </button>
               );
            })}
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
             cart.map(item => {
                const price = getPriceForLocation(item, activeLocationId);
                return (
                 <div key={item.id} className="flex gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-300">
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
                       <p className="font-bold text-slate-900">${(price * item.cartQty).toFixed(2)}</p>
                       <button 
                         onClick={() => removeFromCart(item.id)}
                         className="text-red-400 hover:text-red-600 p-1"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                 </div>
                );
             })
           )}
        </div>

        {/* Action & Totals Section */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
           {/* Customer Select */}
           <div className="relative">
             <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <select 
               value={selectedCustomerId}
               onChange={(e) => setSelectedCustomerId(e.target.value)}
               className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
             >
                <option value="">Walk-in Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints} pts)</option>
                ))}
             </select>
           </div>

           {/* Discount */}
           <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number"
                  placeholder="Discount %"
                  min="0" max="100"
                  value={discountPercent || ''}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-center bg-indigo-100 text-indigo-700 px-3 rounded-lg text-xs font-bold">
                 +{loyaltyPointsEarned} pts
              </div>
           </div>

           <div className="border-t border-slate-200 pt-2 space-y-1">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-1">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
           </div>
           
           <div className="pt-2">
             <button 
               onClick={() => setIsCheckoutModalOpen(true)}
               disabled={cart.length === 0}
               className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg"
             >
               Proceed to Checkout
             </button>
           </div>
        </div>

        {/* Checkout Confirmation Modal */}
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCheckoutModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="text-indigo-600" size={20} />
                  Review Order
                </h2>
                <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Summary Card */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Customer</span>
                      <span className="font-medium text-slate-900">{selectedCustomer?.name || 'Walk-in Customer'}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Items</span>
                      <span className="font-medium text-slate-900">{cart.reduce((a, b) => a + b.cartQty, 0)} units</span>
                   </div>
                   {discountPercent > 0 && (
                     <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>{discountPercent}% (-${discountAmount.toFixed(2)})</span>
                     </div>
                   )}
                   <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                      <span className="text-slate-600 font-medium">Total Payable</span>
                      <span className="text-2xl font-bold text-slate-900">${total.toFixed(2)}</span>
                   </div>
                </div>

                {/* Items List (Collapsed) */}
                <div>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Details</h3>
                   <div className="space-y-2 border border-slate-100 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                           <span className="text-slate-600 truncate flex-1 pr-4">{item.cartQty}x {item.name}</span>
                           <span className="text-slate-900 font-medium">
                             ${(getPriceForLocation(item, activeLocationId) * item.cartQty).toFixed(2)}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => finalizeSale('CARD')}
                   className="flex flex-col items-center justify-center gap-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                 >
                   <CreditCard size={20} />
                   <span>Pay Card</span>
                 </button>
                 <button 
                   onClick={() => finalizeSale('CASH')}
                   className="flex flex-col items-center justify-center gap-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                 >
                   <Banknote size={20} />
                   <span>Pay Cash</span>
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {lastTransaction && (
          <ReceiptModal 
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            transactionId={lastTransaction.id}
            cartItems={lastTransaction.items}
            subtotal={lastTransaction.subtotal}
            discount={lastTransaction.discount}
            total={lastTransaction.total}
            customerName={lastTransaction.customer}
          />
        )}
      </div>
    </div>
  );
};

export default POSView;
