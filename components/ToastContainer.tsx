
import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { Toast } from '../types';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useInventory();

  if (toasts.length === 0) return null;

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={18} />;
      case 'ERROR': return <AlertCircle size={18} />;
      case 'WARNING': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'SUCCESS': return 'bg-green-50 border-green-200 text-green-800';
      case 'ERROR': return 'bg-red-50 border-red-200 text-red-800';
      case 'WARNING': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-indigo-50 border-indigo-200 text-indigo-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`flex items-center gap-3 p-3 rounded-lg border shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${getStyles(toast.type)}`}
        >
          <div className="shrink-0">
            {getIcon(toast.type)}
          </div>
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button 
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
