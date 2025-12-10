
import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Loader2, Printer, Store, Package, DollarSign } from 'lucide-react';
import { InventoryItem, Category } from '../types';
import { generateProductDetails } from '../services/geminiService';
import { useInventory } from '../context/ShopContext';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: InventoryItem | null;
  isAdjustment?: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, initialData, isAdjustment }) => {
  const { locations } = useInventory();
  const [activeTab, setActiveTab] = useState<'details' | 'pricing'>('details');
  
  // Form state
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    sku: '', name: '', description: '', category: Category.Electronics,
    costPrice: 0, sellingPrice: 0, stockQuantity: 0, lowStockThreshold: 10, supplier: '', barcode: '',
    locationPrices: {}
  });
  
  // Specific states for logic
  const [isGenerating, setIsGenerating] = useState(false);
  const [adjustReason, setAdjustReason] = useState('Manual Adjustment');
  const [adjustQty, setAdjustQty] = useState(0);
  
  // For adjustments and new items
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [initialStockInput, setInitialStockInput] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        locationPrices: initialData.locationPrices || {}
      });
      setAdjustQty(0);
      setInitialStockInput(0);
      // Default location for adjustment to first available or first in list
      setSelectedLocationId(locations[0]?.id || '');
    } else {
      setFormData({
        sku: '', name: '', description: '', category: Category.Electronics,
        costPrice: 0, sellingPrice: 0, stockQuantity: 0, lowStockThreshold: 10, supplier: '', barcode: '',
        locationPrices: {}
      });
      setInitialStockInput(0);
      setSelectedLocationId(locations[0]?.id || '');
    }
    setActiveTab('details');
  }, [initialData, isOpen, locations]);

  const handleGenerateAI = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    const suggestion = await generateProductDetails(formData.name);
    setFormData(prev => ({
      ...prev,
      description: suggestion.description,
      sellingPrice: suggestion.suggestedPrice,
      category: suggestion.category as Category,
      sku: !prev.sku ? suggestion.skuSuggestion : prev.sku
    }));
    setIsGenerating(false);
  };

  const handlePriceChange = (locId: string, price: string) => {
    const newPrices = { ...formData.locationPrices };
    if (!price) {
      delete newPrices[locId];
    } else {
      newPrices[locId] = parseFloat(price);
    }
    setFormData(prev => ({ ...prev, locationPrices: newPrices }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdjustment) {
      onSubmit({ 
        id: initialData?.id, 
        locationId: selectedLocationId,
        quantity: adjustQty, 
        reason: adjustReason 
      });
    } else {
      // Add New Item or Update
      onSubmit({ 
        ...formData, 
        barcode: formData.barcode || formData.sku, // Default barcode to SKU if empty
        initialStock: initialStockInput,
        locationId: selectedLocationId 
      });
    }
    onClose();
  };

  // Simple Barcode SVG Generator
  const Barcode = ({ value }: { value: string }) => {
    if (!value) return null;
    return (
      <div className="flex flex-col items-center bg-white p-2 border border-slate-200 rounded w-full">
        <div className="h-12 w-full flex items-end justify-center gap-[2px] overflow-hidden px-4">
           {value.split('').map((char, i) => (
             <div 
               key={i} 
               className="bg-slate-900" 
               style={{ 
                 height: `${Math.max(60, (char.charCodeAt(0) % 50) + 40)}%`, 
                 width: '4px' 
               }} 
             />
           ))}
        </div>
        <div className="text-xs font-mono mt-1 tracking-widest text-slate-600">{value}</div>
      </div>
    );
  };

  if (!isOpen) return null;

  const currentStockInSelectedLocation = initialData && selectedLocationId 
    ? (initialData.stockDistribution[selectedLocationId] || 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {isAdjustment ? `Adjust Stock: ${initialData?.name}` : (initialData ? 'Edit Product' : 'New Product')}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tabs (Only in Edit/Create Mode) */}
          {!isAdjustment && (
            <div className="flex border-b border-slate-200 mb-4 sticky top-0 bg-white z-10 pt-4">
              <button 
                type="button"
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button 
                type="button"
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pricing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('pricing')}
              >
                Multi-Location Pricing
              </button>
            </div>
          )}

          {isAdjustment ? (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Location</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <span className="block text-sm text-slate-500">Current @ Loc</span>
                  <span className="text-2xl font-bold text-slate-900">{currentStockInSelectedLocation}</span>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                   <span className="block text-sm text-indigo-600">New Total</span>
                   <span className="text-2xl font-bold text-indigo-700">
                     {currentStockInSelectedLocation + Number(adjustQty)}
                   </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Quantity (+/-)</label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Negative to remove stock, Positive to add.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason Code</label>
                <select 
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Restock</option>
                  <option>Sale Correction</option>
                  <option>Damage/Spoilage</option>
                  <option>Inventory Audit</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* DETAILS TAB */}
              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="col-span-2 relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                    <div className="flex gap-2">
                      <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g. Wireless Mouse"
                        />
                        {!initialData && (
                          <button
                            type="button"
                            onClick={handleGenerateAI}
                            disabled={isGenerating || !formData.name}
                            className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                          >
                            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            AI Auto-Fill
                          </button>
                        )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                    <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={e => setFormData({...formData, sku: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as Category})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Barcode Section */}
                  <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Barcode Label</label>
                        <Barcode value={formData.barcode || formData.sku || 'PENDING'} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <button 
                          type="button"
                          onClick={() => alert("Printing label for " + (formData.sku))}
                          className="p-2 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-600 flex flex-col items-center justify-center gap-1 text-xs font-medium w-20"
                        >
                          <Printer size={16} />
                          Print
                        </button>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.costPrice}
                        onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Selling Price</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.sellingPrice}
                        onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>

                  {/* Initial Stock Section - Only for New Items */}
                  {!initialData && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                        <input
                            type="number"
                            required
                            value={initialStockInput}
                            onChange={e => setInitialStockInput(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                          />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <select
                            value={selectedLocationId}
                            onChange={e => setSelectedLocationId(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                        >
                          {locations.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Limit</label>
                    <input
                        type="number"
                        required
                        value={formData.lowStockThreshold}
                        onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                    <input
                        type="text"
                        value={formData.supplier}
                        onChange={e => setFormData({...formData, supplier: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                  </div>
                </div>
              )}

              {/* PRICING TAB */}
              {activeTab === 'pricing' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 mt-1">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-900 text-sm">Location-Specific Pricing</h4>
                      <p className="text-xs text-indigo-700 mt-1">
                        Set different selling prices for warehouses or specific store branches. 
                        Leave the field blank to use the Base Selling Price (${formData.sellingPrice || 0}).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {locations.map(loc => (
                      <div key={loc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${loc.type === 'WAREHOUSE' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                              {loc.type === 'WAREHOUSE' ? <Package size={16} /> : <Store size={16} />}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{loc.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{loc.type.toLowerCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                             <p className="text-[10px] text-slate-400 uppercase tracking-wider">Override Price</p>
                             <div className="relative">
                               <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                               <input 
                                 type="number" 
                                 step="0.01"
                                 placeholder={(formData.sellingPrice || 0).toFixed(2)}
                                 value={formData.locationPrices?.[loc.id] || ''}
                                 onChange={(e) => handlePriceChange(loc.id, e.target.value)}
                                 className="w-24 pl-5 pr-2 py-1.5 text-right text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                               />
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0 z-10 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
