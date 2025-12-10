
import React, { useState, useMemo } from 'react';
import { Search, Download, Filter, ArrowUpRight, ArrowDownLeft, RefreshCw, History, CheckCircle, AlertCircle } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Transaction } from '../types';

const ActivityLogView: React.FC = () => {
  const { transactions, inventory, locations, employees } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterUser, setFilterUser] = useState<string>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const item = inventory.find(i => i.id === t.itemId);
      const itemName = item?.name.toLowerCase() || 'deleted item';
      const itemSku = item?.sku.toLowerCase() || '';
      const matchesSearch = 
        itemName.includes(searchTerm.toLowerCase()) || 
        itemSku.includes(searchTerm.toLowerCase()) || 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'ALL' || t.type === filterType;
      const matchesUser = filterUser === 'ALL' || t.userName === filterUser;

      return matchesSearch && matchesType && matchesUser;
    });
  }, [transactions, searchTerm, filterType, filterUser, inventory]);

  const handleExport = () => {
    const headers = ['Transaction ID', 'Date', 'Type', 'Product', 'SKU', 'Quantity', 'Location', 'User', 'Reason'];
    const rows = filteredTransactions.map(t => {
      const item = inventory.find(i => i.id === t.itemId);
      const location = locations.find(l => l.id === t.locationId);
      return [
        t.id,
        new Date(t.timestamp).toLocaleString(),
        t.type,
        item?.name || 'Unknown',
        item?.sku || 'N/A',
        t.quantity,
        location?.name || 'N/A',
        t.userName,
        t.reason || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rims_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeStyle = (type: Transaction['type']) => {
    switch (type) {
      case 'SALE': return 'bg-green-100 text-green-700';
      case 'RESTOCK': return 'bg-blue-100 text-blue-700';
      case 'ADJUSTMENT': return 'bg-amber-100 text-amber-700';
      case 'TRANSFER': return 'bg-purple-100 text-purple-700';
      case 'AUDIT': return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const uniqueUsers = Array.from(new Set(transactions.map(t => t.userName)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="text-slate-500" />
            Audit Log
          </h2>
          <p className="text-sm text-slate-500">Track detailed history of all stock movements and adjustments.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by ID, SKU, Product or Reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="SALE">Sales</option>
              <option value="RESTOCK">Restocks</option>
              <option value="ADJUSTMENT">Adjustments</option>
              <option value="TRANSFER">Transfers</option>
              <option value="AUDIT">Audits</option>
            </select>
          </div>

          <div className="relative">
             <select 
               value={filterUser}
               onChange={(e) => setFilterUser(e.target.value)}
               className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
             >
               <option value="ALL">All Users</option>
               {uniqueUsers.map(user => (
                 <option key={user} value={user}>{user}</option>
               ))}
             </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Change</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTransactions.map((tx) => {
                const item = inventory.find(i => i.id === tx.itemId);
                const location = locations.find(l => l.id === tx.locationId);
                const toLocation = tx.toLocationId ? locations.find(l => l.id === tx.toLocationId) : null;
                
                return (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyle(tx.type)}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{item?.name || 'Unknown Item'}</span>
                        <span className="text-xs text-slate-500 font-mono">{item?.sku || tx.itemId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className={`flex items-center justify-center gap-1 font-bold text-sm ${
                        ['SALE', 'TRANSFER'].includes(tx.type) ? 'text-red-600' : 'text-green-600'
                      }`}>
                         {['SALE', 'TRANSFER'].includes(tx.type) ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                         {tx.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                       <div className="flex items-center gap-1">
                          {location?.name || 'Unknown'}
                          {toLocation && (
                             <>
                               <ArrowUpRight size={12} className="text-slate-400" />
                               {toLocation.name}
                             </>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                      {tx.userName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                      {tx.reason || '-'}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle size={32} className="mb-2 opacity-20" />
                        <p>No records found matching your filters.</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogView;
