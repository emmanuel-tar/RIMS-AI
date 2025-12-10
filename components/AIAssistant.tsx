import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { createInventoryChat } from '../services/geminiService';
import { Message } from '../types';
import { Chat } from '@google/genai';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', text: 'Hello. I am the RIMS Inventory Assistant. Ask me about stock levels, valuation, or help with drafting emails.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      chatSessionRef.current = createInventoryChat();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) return;

      const result = await chatSessionRef.current.sendMessage({ message: userText });
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: result.text
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error connecting to AI service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
           <div className="flex items-center gap-2">
             <div className="bg-indigo-500 p-1.5 rounded text-white">
               <Sparkles size={18} />
             </div>
             <div>
               <h3 className="font-semibold text-sm">Inventory Assistant</h3>
               <p className="text-xs text-slate-400">Powered by Gemini</p>
             </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
           {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                 }`}>
                   {msg.text}
                 </div>
              </div>
           ))}
           {isLoading && (
             <div className="flex justify-start">
               <div className="bg-white border border-slate-200 px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2">
                 <Loader2 size={14} className="animate-spin text-indigo-600" />
                 <span className="text-xs text-slate-400">Analyzing inventory...</span>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
           <form onSubmit={handleSend} className="relative">
             <input
               type="text"
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               placeholder="Ask about stock, suppliers, or reports..."
               className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
               autoFocus
             />
             <button 
               type="submit" 
               disabled={isLoading || !inputValue.trim()}
               className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
             >
               <Send size={16} />
             </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;