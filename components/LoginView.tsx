
import React, { useState } from 'react';
import { Sparkles, Lock, ArrowRight, AlertCircle, User } from 'lucide-react';
import { useInventory } from '../context/ShopContext';
import { MOCK_EMPLOYEES } from '../constants';

const LoginView: React.FC = () => {
  const { login } = useInventory();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for realism
    setTimeout(() => {
      const success = login(email);
      if (!success) {
        setError('Invalid credentials. Try using a demo account.');
        setIsLoading(false);
      }
      // If success, the App wrapper will auto-switch views
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="w-24 h-24 bg-white rounded-full absolute -top-4 -left-4 blur-xl"></div>
             <div className="w-32 h-32 bg-indigo-500 rounded-full absolute bottom-0 right-0 blur-2xl"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-indigo-600 p-3 rounded-xl mb-4 shadow-lg shadow-indigo-900/50">
               <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">RIMS AI</h1>
            <p className="text-indigo-200 text-sm mt-1">Retail Inventory Management System</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Sign in to access your store dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="employee@rims.local"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Demo Hint */}
          <div className="mt-8 pt-6 border-t border-slate-100">
             <p className="text-xs text-center text-slate-400 uppercase tracking-widest mb-3">Demo Accounts</p>
             <div className="grid grid-cols-2 gap-2">
               {MOCK_EMPLOYEES.slice(0, 2).map(emp => (
                 <button 
                   key={emp.id}
                   onClick={() => setEmail(emp.email)}
                   className="text-xs p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 text-left transition-colors"
                 >
                   <span className="font-bold block text-slate-800">{emp.role}</span>
                   {emp.email}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 text-slate-400 text-xs text-center w-full">
        RIMS AI v1.0.0 • Secured Retail Environment
      </div>
    </div>
  );
};

export default LoginView;
