import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';

const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity } = useShop();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={toggleCart}
      />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full animate-slide-in-right">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Your Cart
            </h2>
            <button 
              onClick={toggleCart} 
              className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                  <ShoppingBag size={32} />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">Your cart is empty</p>
                  <p className="text-gray-500 text-sm">Looks like you haven't added anything yet.</p>
                </div>
                <button 
                  onClick={toggleCart}
                  className="px-6 py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-6">
                {cart.map((item) => (
                  <li key={item.id} className="flex py-2">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <h3 className="line-clamp-1">{item.name}</h3>
                          <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                      </div>
                      <div className="flex flex-1 items-end justify-between text-sm">
                        <div className="flex items-center border border-gray-200 rounded-md">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100 text-gray-500"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 font-medium text-gray-900">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100 text-gray-500"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="font-medium text-red-500 hover:text-red-600 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-6 bg-gray-50">
              <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                <p>Subtotal</p>
                <p>${total.toFixed(2)}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 mb-6">
                Shipping and taxes calculated at checkout.
              </p>
              <button
                className="w-full flex items-center justify-center rounded-xl border border-transparent bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary/90 transition-all hover:scale-[1.02]"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;