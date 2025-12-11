
import React, { useState, useRef } from 'react';
import { Edit2, Trash2, AlertCircle, TrendingUp, TrendingDown, ArrowRightLeft, Tag, Clock, Printer, CheckSquare, Square, Upload } from 'lucide-react';
import { InventoryItem } from '../types';
import { useInventory } from '../context/ShopContext';
import { printLabels } from '../services/printService';
import BulkAdjustModal from './BulkAdjustModal';

interface InventoryTableProps {
  onEdit: (item: InventoryItem) => void;
  onAdjust: (item: InventoryItem) => void;
  onTransfer: (item: InventoryItem) => void;
  selectedLocationId: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ onEdit, onAdjust, onTransfer, selectedLocationId }) => {
  const { inventory, deleteItem, searchQuery, locations, getPriceForLocation, formatCurrency } = useInventory();
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Bulk Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [itemsForBulk, setItemsForBulk] = useState<InventoryItem[]>([]);
  
  // CSV Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Selection Handlers ---
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // --- Action Handlers ---
  const handlePrintAll = () => {
    const sourceItems = selectedIds.size > 0 
      ? filteredItems.filter(i => selectedIds.has(i.id))
      : filteredItems;

    const itemsToPrint = sourceItems.map(item => ({
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      price: getPriceForLocation(item, selectedLocationId === 'all' ? locations[0]?.id : selectedLocationId),
      count: 1 
    }));
    printLabels(itemsToPrint);
  };

  const handleBulkAdjust = () => {
    const selected = inventory.filter(i => selectedIds.has(i.id));
    setItemsForBulk(selected);
    setIsBulkModalOpen(true);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      // Simple CSV parsing: expecting "SKU, Quantity" or just "SKU"
      // Split by new line
      const lines = text.split(/\r?\n/);
      const skusFound = new Set<string>();
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const [sku] = line.split(',').map(s => s.trim());
        if (sku) skusFound.add(sku.toLowerCase());
      });

      // Find items in inventory matching these SKUs
      const matchedItems = inventory.filter(item => 
        skusFound.has(item.sku.toLowerCase()) || skusFound.has(item.barcode?.toLowerCase() || '')
      );

      if (matchedItems.length > 0) {
        setItemsForBulk(matchedItems);
        setIsBulkModalOpen(true);
        // Clear selection to avoid confusion, or perhaps select them? 
        // Let's just open the modal with them found.
      } else {
        alert("No matching products found in CSV.");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center gap-4 flex-wrap">
         <div className="flex items-center gap-4">
            <h3 className="font-semibold text-slate-700">Inventory List ({filteredItems.length})</h3>
            
            {/* Bulk Actions Toolbar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200">
                 <div className="h-6 w-px bg-slate-300 mx-2"></div>
                 <span className="text-sm font-bold text-indigo-600">{selectedIds.size} Selected</span>
                 <button 
                   onClick={handleBulkAdjust}
                   className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                 >
                   Bulk Adjust Stock
                 </button>
                 <button 
                   onClick={handlePrintAll}
                   className="text-xs bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded-lg font-medium transition-colors"
                 >
                   Print Labels
                 </button>
              </div>
            )}
         </div>

         <div className="flex gap-2">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              className="hidden"
              onChange={handleCSVImport}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
              title="Upload CSV (SKU column)"
            >
              <Upload size={16} />
              Import CSV
            </button>
            <button 
              onClick={handlePrintAll}
              className="text-sm bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Printer size={16} />
              Print Visible
            </button>
         </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-4 w-10">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                  {selectedIds.size > 0 && selectedIds.size === filteredItems.length ? <CheckSquare size={20} /> : <Square size={20} />}
                </button>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU / Product</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {selectedLocationId === 'all' ? 'Total Stock' : 'Local Stock'}
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredItems.map((item) => {
              const stockToShow = selectedLocationId === 'all' 
                ? item.stockQuantity 
                : (item.stockDistribution[selectedLocationId] || 0);

              const isLowStock = stockToShow <= item.lowStockThreshold;
              const currentPrice = getPriceForLocation(item, selectedLocationId === 'all' ? locations[0]?.id : selectedLocationId);
              const hasPriceOverride = selectedLocationId !== 'all' && item.locationPrices?.[selectedLocationId];
              const isSelected = selectedIds.has(item.id);

              let isExpiringSoon = false;
              if (item.expiryDate) {
                 const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                 isExpiringSoon = daysUntilExpiry <= 30;
              }

              return (
                <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelectRow(item.id)} className={`${isSelected ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}>
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{item.name}</span>
                      <div className="flex items-center gap-2">
                         <span className="text-xs text-slate-500 font-mono">{item.sku}</span>
                         {isExpiringSoon && (
                           <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-0.5">
                             <Clock size={10} /> Expiring
                           </span>
                         )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-2.5 w-2.5 rounded-full mr-2 ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                          {stockToShow} Units
                        </span>
                        {selectedLocationId === 'all' && (
                          <span className="text-[10px] text-slate-400">
                            {Object.entries(item.stockDistribution).filter(([_, qty]: [string, number]) => qty > 0).length} Locs
                          </span>
                        )}
                      </div>
                      {isLowStock && <AlertCircle className="w-4 h-4 text-red-500 ml-2" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    <div className="flex flex-col items-end">
                      <span className="flex items-center gap-1">
                        {formatCurrency(currentPrice)}
                        {hasPriceOverride && (
                          <span title="Custom Price Override Active" className="bg-amber-100 text-amber-700 p-0.5 rounded">
                            <Tag size={10} />
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-slate-400">Cost: {formatCurrency(item.costPrice)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                    {formatCurrency(currentPrice * stockToShow)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => printLabels([{
                          name: item.name,
                          sku: item.sku,
                          barcode: item.barcode,
                          price: currentPrice,
                          count: 1
                        }])}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Print Label"
                       >
                         <Printer size={18} />
                       </button>
                       <button 
                        onClick={() => onTransfer(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Transfer Stock"
                       >
                         <ArrowRightLeft size={18} />
                       </button>
                       <button 
                        onClick={() => onAdjust(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Adjust Stock"
                       >
                         {stockToShow > item.lowStockThreshold ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                       </button>
                       <button 
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit Item"
                       >
                         <Edit2 size={18} />
                       </button>
                       <button 
                        onClick={() => {
                          if(confirm('Are you sure you want to delete this item?')) deleteItem(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Item"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No items found. Try adjusting your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BulkAdjustModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedItems={itemsForBulk}
        defaultLocationId={selectedLocationId}
      />
    </div>
  );
};

export default InventoryTable;
