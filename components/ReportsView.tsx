
import React, { useMemo } from 'react';
import { PieChart, TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Category } from '../types';

interface CategoryReport {
  category: string;
  itemCount: number;
  stockQuantity: number;
  costValue: number;
  retailValue: number;
  margin: number;
}

const ReportsView: React.FC = () => {
  const { inventory, locations } = useInventory();
  
  // Note: We currently show reports for ALL locations to give a high-level owner view.
  // In a future update, we could pass selectedLocationId here to filter.

  const reportData = useMemo(() => {
    const data: Record<string, CategoryReport> = {};

    // Initialize categories
    Object.values(Category).forEach(cat => {
      data[cat] = {
        category: cat,
        itemCount: 0,
        stockQuantity: 0,
        costValue: 0,
        retailValue: 0,
        margin: 0
      };
    });

    inventory.forEach(item => {
      const cat = item.category;
      if (data[cat]) {
        data[cat].itemCount += 1;
        data[cat].stockQuantity += item.stockQuantity;
        data[cat].costValue += item.stockQuantity * item.costPrice;
        data[cat].retailValue += item.stockQuantity * item.sellingPrice;
      }
    });

    // Calculate margins
    Object.values(data).forEach(d => {
      d.margin = d.retailValue - d.costValue;
    });

    return Object.values(data).sort((a, b) => b.retailValue - a.retailValue);
  }, [inventory]);

  const totals = useMemo(() => {
    return reportData.reduce((acc, curr) => ({
      retailValue: acc.retailValue + curr.retailValue,
      costValue: acc.costValue + curr.costValue,
      stockQuantity: acc.stockQuantity + curr.stockQuantity,
      margin: acc.margin + curr.margin
    }), { retailValue: 0, costValue: 0, stockQuantity: 0, margin: 0 });
  }, [reportData]);

  const maxCategoryValue = Math.max(...reportData.map(d => d.retailValue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
           <div className="bg-purple-100 p-2 rounded-lg">
             <BarChart3 className="text-purple-600 w-6 h-6" />
           </div>
           <div>
             <h2 className="text-xl font-bold text-slate-800">Stock Valuation Report</h2>
             <p className="text-sm text-slate-500">Financial breakdown of current inventory assets by category.</p>
           </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5">
             <DollarSign size={100} />
           </div>
           <p className="text-sm font-medium text-slate-500 mb-1">Total Retail Value</p>
           <h3 className="text-3xl font-bold text-slate-900">
             ${totals.retailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </h3>
           <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
             <TrendingUp size={14} /> Potential Revenue
           </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5">
             <Package size={100} />
           </div>
           <p className="text-sm font-medium text-slate-500 mb-1">Total Cost Value</p>
           <h3 className="text-3xl font-bold text-slate-900">
             ${totals.costValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </h3>
           <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
             Asset Investment
           </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5">
             <PieChart size={100} />
           </div>
           <p className="text-sm font-medium text-slate-500 mb-1">Estimated Gross Margin</p>
           <h3 className="text-3xl font-bold text-indigo-600">
             ${totals.margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </h3>
           <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
             {totals.retailValue > 0 ? ((totals.margin / totals.retailValue) * 100).toFixed(1) : 0}% Margin Rate
           </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Category Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">Value Distribution</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Qty</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Value</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Retail Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reportData.map((row) => (
                <tr key={row.category} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-slate-900">{row.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-middle">
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ width: `${(row.retailValue / maxCategoryValue) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {row.itemCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {row.stockQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    ${row.costValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                    ${row.retailValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-slate-900">
               <tr>
                 <td className="px-6 py-4">Total</td>
                 <td></td>
                 <td className="px-6 py-4 text-right">{inventory.length}</td>
                 <td className="px-6 py-4 text-right">{totals.stockQuantity}</td>
                 <td className="px-6 py-4 text-right">${totals.costValue.toLocaleString()}</td>
                 <td className="px-6 py-4 text-right">${totals.retailValue.toLocaleString()}</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
