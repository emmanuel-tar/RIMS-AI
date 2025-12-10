
import React, { useMemo, useState } from 'react';
import { 
  DollarSign, Package, AlertTriangle, ArrowUpRight, 
  TrendingUp, Activity, Calendar, ArrowRight 
} from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Transaction } from '../types';

const DashboardView: React.FC<{ onNavigate: (view: any) => void }> = ({ onNavigate }) => {
  const { stats, inventory, transactions, locations } = useInventory();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // --- Data Processing for Charts ---

  // 1. Sales Trend (Last 7 Days)
  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dailyTotal = transactions
        .filter(t => t.type === 'SALE' && t.timestamp.startsWith(date))
        .reduce((sum, t) => {
           // Find item to get price (simplified, ideally transaction stores price snapshot)
           const item = inventory.find(i => i.id === t.itemId);
           return sum + (t.quantity * (item?.sellingPrice || 0));
        }, 0);
      
      return { date: date.split('-').slice(1).join('/'), value: dailyTotal, fullDate: date };
    });
  }, [transactions, inventory]);

  const maxSales = Math.max(...salesData.map(d => d.value), 100); // Prevent divide by zero

  // 2. Recent Activity
  const recentActivity = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  // 3. Low Stock Items
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.stockQuantity <= item.lowStockThreshold).slice(0, 5);
  }, [inventory]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between group hover:border-indigo-300 transition-colors">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Inventory Value</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              ${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium bg-green-50 w-fit px-2 py-0.5 rounded-full">
              <TrendingUp size={12} /> +2.5% vs last month
            </span>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between group hover:border-blue-300 transition-colors">
           <div>
            <p className="text-sm font-medium text-slate-500">Total Items in Stock</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              {stats.totalItems.toLocaleString()}
            </h3>
            <span className="text-xs text-slate-400 mt-1 block">
              Across {locations.length} locations
            </span>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Package size={20} />
          </div>
        </div>

        <div 
          onClick={() => onNavigate('inventory')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between cursor-pointer group hover:border-red-300 transition-colors"
        >
           <div>
            <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
            <h3 className={`text-2xl font-bold mt-2 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {stats.lowStockCount}
            </h3>
            <span className="text-xs text-red-600 mt-1 block">
              Items below threshold
            </span>
          </div>
          <div className={`p-3 rounded-lg ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-slate-50 text-slate-600'}`}>
            <AlertTriangle size={20} />
          </div>
        </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between group hover:border-purple-300 transition-colors">
           <div>
            <p className="text-sm font-medium text-slate-500">Active Categories</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              {stats.categories}
            </h3>
            <span className="text-xs text-slate-400 mt-1 block">
              Product diversity
            </span>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
            <ArrowUpRight size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Sales Trends</h3>
               <p className="text-sm text-slate-500">Revenue over the last 7 days</p>
             </div>
             <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
               <Calendar size={14} />
               Last 7 Days
             </div>
           </div>
           
           {/* Custom SVG Bar Chart */}
           <div className="h-64 w-full flex items-end justify-between gap-2">
              {salesData.map((data, index) => {
                const heightPercentage = (data.value / maxSales) * 100;
                return (
                  <div 
                    key={index} 
                    className="flex-1 flex flex-col items-center gap-2 group relative"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip */}
                    <div className={`absolute -top-10 bg-slate-800 text-white text-xs py-1 px-2 rounded transition-opacity duration-200 ${hoveredBar === index ? 'opacity-100' : 'opacity-0'}`}>
                      ${data.value.toFixed(2)}
                    </div>

                    <div className="w-full bg-slate-100 rounded-t-md relative h-full flex items-end overflow-hidden">
                      <div 
                        className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-500 ease-out rounded-t-md"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{data.date}</span>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Activity size={18} className="text-indigo-600" />
             Recent Activity
           </h3>
           <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">No recent transactions.</p>
              ) : (
                recentActivity.map(t => (
                  <div key={t.id} className="flex gap-3 items-start pb-3 border-b border-slate-50 last:border-0">
                     <div className={`mt-1 min-w-[8px] h-2 rounded-full ${
                       t.type === 'SALE' ? 'bg-green-500' : 
                       t.type === 'RESTOCK' ? 'bg-blue-500' : 
                       t.type === 'AUDIT' ? 'bg-amber-500' : 'bg-slate-300'
                     }`} />
                     <div>
                        <p className="text-sm font-medium text-slate-800">
                          {t.type === 'SALE' ? 'New Sale' : 
                           t.type === 'RESTOCK' ? 'Stock Added' : 
                           t.type === 'AUDIT' ? 'Audit Adjustment' : t.type}
                        </p>
                        <p className="text-xs text-slate-500">{t.reason || `Item ID: ${t.itemId}`}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(t.timestamp).toLocaleTimeString()}</p>
                     </div>
                     {t.type === 'SALE' && (
                       <span className="ml-auto text-xs font-bold text-green-600">+{t.quantity} sold</span>
                     )}
                  </div>
                ))
              )}
           </div>
           <button 
             onClick={() => onNavigate('reports')} // Or a dedicated transactions view
             className="mt-4 w-full py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
           >
             View All Transactions
           </button>
        </div>
      </div>

      {/* Low Stock Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                <h3 className="font-semibold text-slate-800">Critical Stock Alerts</h3>
              </div>
              <button onClick={() => onNavigate('inventory')} className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            
            <div className="divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                  <p>All stock levels are healthy.</p>
                </div>
              ) : (
                lowStockItems.map(item => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
                          !
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500 font-mono">SKU: {item.sku}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase">Current Stock</p>
                          <p className="font-bold text-red-600">{item.stockQuantity}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-500 uppercase">Reorder Level</p>
                          <p className="font-medium text-slate-700">{item.lowStockThreshold}</p>
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>
         </div>

         {/* Quick Actions / Tips */}
         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">RIMS AI Tips</h3>
              <p className="text-indigo-100 text-sm mb-6">
                Your inventory turnover rate has improved by 5% this week. Consider creating a purchase order for "Electronics" to maintain momentum.
              </p>
            </div>
            <div className="space-y-3">
               <button 
                 onClick={() => onNavigate('pos')}
                 className="w-full py-2.5 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
               >
                 Open Point of Sale
               </button>
               <button 
                 onClick={() => onNavigate('orders')}
                 className="w-full py-2.5 bg-indigo-500/50 border border-indigo-400 text-white rounded-lg font-medium text-sm hover:bg-indigo-500 transition-colors"
               >
                 Create Purchase Order
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

// Helper for empty state in alerts
const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default DashboardView;
