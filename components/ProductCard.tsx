import React from 'react';
import { Plus, Star } from 'lucide-react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useShop();

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="aspect-[1/1] overflow-hidden bg-gray-100 relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="absolute bottom-3 right-3 bg-white text-primary p-2.5 rounded-full shadow-md opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white"
          aria-label="Add to cart"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{product.category}</p>
          <div className="flex items-center gap-1 text-amber-400">
             <Star size={12} fill="currentColor" />
             <span className="text-xs text-gray-500 font-medium">{product.rating}</span>
          </div>
        </div>
        
        <h3 className="text-md font-semibold text-gray-900 mb-1 leading-tight group-hover:text-accent transition-colors">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;