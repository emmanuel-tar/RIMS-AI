
import React, { useState } from 'react';
import { X, DollarSign, Lock, Unlock, AlertTriangle, CheckCircle, FileText, Printer } from 'lucide-react';
import { useInventory } from '../context/ShopContext';

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
}

const CashShiftModal: React.FC<CashShiftModalProps> = ({ isOpen, onClose, locationId }) => {
  const { currentShift, openShift, closeShift, locations, currentUser } = useInventory();
  
  const [startAmount, setStartAmount] = useState<string>('0');
  const [endAmount, setEndAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'OPEN' | 'CLOSE_COUNT' | 'Z_REPORT'>('OPEN');

  const locationName = locations.find(l => l.id === locationId)?.name || 'Unknown Location';

  if (!isOpen) return null;

  // Render Logic
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openShift(parseFloat(startAmount) || 0, locationId);
    onClose();
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    closeShift(parseFloat(endAmount) || 0, notes);
    setStep('Z_REPORT');
  };

  const handlePrintZReport = () => {
     window.print();
  };

  // If a shift is already open, default to showing Close options
  if (currentShift && step === 'OPEN') {
      setStep('CLOSE_COUNT');
  }

  // --- VIEW: OPEN SHIFT ---
  if (step === 'OPEN' && !currentShift) {
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Unlock className="text-green-600" size={20} />
                        Open Register
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleOpenShift} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-4">
                        You are opening the shift for <strong>{locationName}</strong> as <strong>{currentUser?.name}</strong>.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Starting Cash (Float)</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                required
                                value={startAmount}
                                onChange={e => setStartAmount(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 text-lg font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors">
                        Confirm & Open Shift
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // --- VIEW: CLOSE SHIFT (COUNTING) ---
  if (step === 'CLOSE_COUNT' && currentShift) {
      const expectedCash = (currentShift.startAmount || 0) + (currentShift.cashSales || 0);
      
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Lock className="text-red-600" size={20} />
                        Close Shift
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleCloseShift} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 uppercase">Starting Float</p>
                            <p className="text-lg font-bold text-slate-700">${currentShift.startAmount.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-xs text-green-600 uppercase">Cash Sales</p>
                            <p className="text-lg font-bold text-green-700">+${currentShift.cashSales.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className="p-3 bg-slate-100 rounded-lg text-center">
                         <p className="text-sm text-slate-500 mb-1">Expected Cash in Drawer</p>
                         <p className="text-3xl font-bold text-slate-900">${expectedCash.toFixed(2)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Physical Cash Count (Actual)</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                required
                                value={endAmount}
                                onChange={e => setEndAmount(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 text-lg font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        {endAmount && (
                            <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${parseFloat(endAmount) - expectedCash < 0 ? 'text-red-600' : parseFloat(endAmount) - expectedCash > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                                <AlertTriangle size={14} />
                                Variance: ${(parseFloat(endAmount) - expectedCash).toFixed(2)}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea 
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Reason for variance..."
                        />
                    </div>

                    <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
                        Close Register & Print Z-Report
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // --- VIEW: Z-REPORT ---
  if (step === 'Z_REPORT') {
      // We assume the shift was just closed and we can use the local state values to display the report temporarily
      // Ideally we fetch the "last closed shift", but for this UX flow, local state works.
      const cashSales = currentShift?.cashSales || 0;
      const cardSales = currentShift?.cardSales || 0;
      const start = currentShift?.startAmount || 0;
      const expected = start + cashSales;
      const actual = parseFloat(endAmount);
      const variance = actual - expected;

      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in max-h-[90vh] flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" size={20} />
                        Z-Report Summary
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
                    <div className="text-center border-b border-dashed border-slate-300 pb-4">
                        <h3 className="font-bold text-lg uppercase tracking-wider">End of Shift</h3>
                        <p className="text-xs text-slate-500">{new Date().toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Loc: {locationName}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between font-medium">
                            <span>Opening Float</span>
                            <span>${start.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-green-700">
                            <span>+ Cash Sales</span>
                            <span>${cashSales.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between font-medium text-blue-700">
                            <span>+ Card Sales</span>
                            <span>${cardSales.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-100 my-2 pt-2"></div>
                        <div className="flex justify-between font-medium text-slate-500">
                            <span>Expected Cash</span>
                            <span>${expected.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between font-bold text-slate-900 text-lg">
                            <span>Actual Count</span>
                            <span>${actual.toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${variance < 0 ? 'text-red-600' : variance > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                            <span>Variance</span>
                            <span>{variance > 0 ? '+' : ''}${variance.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    {notes && (
                        <div className="bg-amber-50 p-2 rounded text-xs text-amber-800 italic border border-amber-100 mt-4">
                            Note: {notes}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                   <button onClick={onClose} className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-100">
                     Close
                   </button>
                   <button onClick={handlePrintZReport} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                     <Printer size={16} /> Print Report
                   </button>
                </div>
            </div>
        </div>
      );
  }

  return null;
};

export default CashShiftModal;
