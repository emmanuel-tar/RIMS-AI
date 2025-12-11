
import React, { useState } from 'react';
import { X, Delete } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  if (!isOpen) return null;

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (nextOperator === 'C') {
        setDisplay('0');
        setExpression('');
        return;
    }

    if (nextOperator === '=') {
        try {
            // eslint-disable-next-line no-eval
            const result = eval(expression + display); 
            setDisplay(String(result));
            setExpression('');
            setWaitingForOperand(true);
        } catch (e) {
            setDisplay('Error');
        }
        return;
    }
    
    // Basic operators
    setExpression(display + nextOperator);
    setWaitingForOperand(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 rounded-2xl shadow-2xl w-72 overflow-hidden border border-slate-700 animate-in fade-in zoom-in">
        {/* Header */}
        <div className="p-3 flex justify-between items-center bg-slate-800">
           <span className="text-white text-xs font-bold uppercase tracking-wider">Calculator</span>
           <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        
        {/* Display */}
        <div className="p-4 text-right bg-slate-900">
           <div className="text-slate-500 text-xs h-4">{expression}</div>
           <div className="text-white text-3xl font-mono">{display}</div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-800">
           {['C', '(', ')', '/'].map(btn => (
             <button key={btn} onClick={() => performOperation(btn)} className="p-3 bg-slate-700 text-white rounded hover:bg-slate-600 font-bold">{btn}</button>
           ))}
           {['7', '8', '9', '*'].map(btn => (
             <button key={btn} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className={`p-3 rounded hover:opacity-90 font-bold ${isNaN(Number(btn)) ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-600 text-white'}`}>{btn}</button>
           ))}
           {['4', '5', '6', '-'].map(btn => (
             <button key={btn} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className={`p-3 rounded hover:opacity-90 font-bold ${isNaN(Number(btn)) ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-600 text-white'}`}>{btn}</button>
           ))}
           {['1', '2', '3', '+'].map(btn => (
             <button key={btn} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className={`p-3 rounded hover:opacity-90 font-bold ${isNaN(Number(btn)) ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-600 text-white'}`}>{btn}</button>
           ))}
           <button onClick={() => inputDigit('0')} className="col-span-2 p-3 bg-slate-600 text-white rounded hover:opacity-90 font-bold">0</button>
           <button onClick={() => inputDigit('.')} className="p-3 bg-slate-600 text-white rounded hover:opacity-90 font-bold">.</button>
           <button onClick={() => performOperation('=')} className="p-3 bg-indigo-600 text-white rounded hover:bg-indigo-500 font-bold">=</button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
