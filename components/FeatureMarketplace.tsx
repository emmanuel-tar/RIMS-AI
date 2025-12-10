
import React from 'react';
import { useInventory } from '../context/ShopContext';
import { FeatureModule } from '../types';
import { 
  Users, Truck, Cloud, Database, BarChart3, 
  Sparkles, Contact, Map, CheckCircle, Lock, MonitorPlay, Wallet 
} from 'lucide-react';

const FeatureMarketplace: React.FC = () => {
  const { settings, toggleFeature } = useInventory();

  const MODULES: { 
    id: FeatureModule; 
    title: string; 
    description: string; 
    icon: React.ReactNode; 
    price: string;
    isCore?: boolean;
  }[] = [
    {
      id: 'TEAM',
      title: 'Team Management',
      description: 'Manage employees, roles (Admin/Manager/Cashier), and secure login access.',
      icon: <Users size={24} />,
      price: 'Free'
    },
    {
      id: 'CRM',
      title: 'Customer Loyalty CRM',
      description: 'Track customer profiles, purchase history, and run a points-based loyalty program.',
      icon: <Contact size={24} />,
      price: 'Free'
    },
    {
      id: 'SUPPLIERS',
      title: 'Supply Chain Pro',
      description: 'Manage supplier database and create Purchase Orders (PO) to track incoming stock.',
      icon: <Truck size={24} />,
      price: '$10/mo'
    },
    {
      id: 'MULTI_LOCATION',
      title: 'Multi-Branch Support',
      description: 'Manage inventory across multiple warehouses and stores with inter-branch transfers.',
      icon: <Map size={24} />,
      price: '$25/mo'
    },
    {
      id: 'FINANCE',
      title: 'Finance & Expenses',
      description: 'Track operational costs (Rent, Utilities) to see true Net Profit and Loss statements.',
      icon: <Wallet size={24} />,
      price: '$15/mo'
    },
    {
      id: 'CLOUD',
      title: 'RIMS Cloud Sync',
      description: 'Connect to the central RIMS Cloud for real-time data synchronization across devices.',
      icon: <Cloud size={24} />,
      price: '$49/mo'
    },
    {
      id: 'AI_ASSISTANT',
      title: 'Gemini AI Copilot',
      description: 'Smart assistant for inventory forecasting, email drafting, and data insights.',
      icon: <Sparkles size={24} />,
      price: '$15/mo'
    },
    {
      id: 'REPORTS',
      title: 'Advanced Analytics',
      description: 'Deep dive into sales trends, stock valuation, and profit margins.',
      icon: <BarChart3 size={24} />,
      price: 'Free'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <Database size={120} />
        </div>
        <h1 className="text-3xl font-bold mb-2">RIMS App Marketplace</h1>
        <p className="text-indigo-200 max-w-xl">
          Customize your retail experience. Activate only the modules you need to keep your interface clean and operations efficient.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MODULES.map(module => {
           const isActive = settings.features[module.id];
           
           return (
             <div 
               key={module.id} 
               className={`rounded-xl border transition-all duration-300 flex flex-col ${
                 isActive 
                   ? 'bg-white border-indigo-200 shadow-md' 
                   : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100 hover:bg-white hover:shadow-sm'
               }`}
             >
                <div className="p-6 flex-1">
                   <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                         {module.icon}
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                         {isActive ? 'Active' : 'Inactive'}
                      </span>
                   </div>
                   
                   <h3 className="font-bold text-slate-900 text-lg mb-2">{module.title}</h3>
                   <p className="text-sm text-slate-500 mb-4 leading-relaxed">{module.description}</p>
                   
                   {module.id === 'CLOUD' && !settings.features['MULTI_LOCATION'] && (
                     <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded mb-2">
                       <Lock size={12} />
                       Requires Multi-Branch Support
                     </div>
                   )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-xl">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{module.price}</span>
                   
                   <button
                     onClick={() => toggleFeature(module.id, !isActive)}
                     disabled={module.id === 'CLOUD' && !settings.features['MULTI_LOCATION']}
                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                       isActive 
                         ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                         : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                     }`}
                   >
                     {isActive ? 'Deactivate' : 'Activate Module'}
                   </button>
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default FeatureMarketplace;
