import React from 'react';
import Home from './pages/Home';
import { InventoryProvider } from './context/ShopContext';

function App() {
  return (
    <InventoryProvider>
       <Home />
    </InventoryProvider>
  );
}

export default App;