
import React from 'react';
import { Edit2, Trash2, AlertCircle, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { InventoryItem } from '../types';
import { useInventory } from '../context/ShopContext';

interface InventoryTableProps {
  onEdit: (item: InventoryItem) => void;
  onAdjust: (item: InventoryItem) => void;
  onTransfer: (item: InventoryItem) => void;
  selectedLocationId: string;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ onEdit, onAdjust, onTransfer, selectedLocationId }) => {
  const { inventory, deleteItem, searchQuery, locations } = useInventory();

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || 'Unknown';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
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
              // Calculate stock based on selection
              const stockToShow = selectedLocationId === 'all' 
                ? item.stockQuantity 
                : (item.stockDistribution[selectedLocationId] || 0);

              const isLowStock = stockToShow <= item.lowStockThreshold;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{item.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{item.sku}</span>
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
                    ${item.sellingPrice.toFixed(2)}
                    <span className="block text-xs text-slate-400">Cost: ${item.costPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                    ${(item.sellingPrice * stockToShow).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
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
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No items found. Try adjusting your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
