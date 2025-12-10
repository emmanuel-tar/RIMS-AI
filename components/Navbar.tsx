import React from 'react';
import { ShoppingBag, Search, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface NavbarProps {
  onSearchClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const { cart, toggleCart, resetFilter } = useShop();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 cursor-pointer flex items-center gap-2" onClick={resetFilter}>
             <div className="bg-primary text-white p-1.5 rounded-lg">
                <Sparkles size={20} />
             </div>
             <span className="font-bold text-xl tracking-tight text-primary">ShopPlace</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={onSearchClick}
              className="p-2 text-gray-500 hover:text-accent transition-colors duration-200 rounded-full hover:bg-gray-50 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">AI Search</span>
            </button>
            
            <button 
              onClick={toggleCart}
              className="relative p-2 text-gray-500 hover:text-accent transition-colors duration-200 rounded-full hover:bg-gray-50"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;