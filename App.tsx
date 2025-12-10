
import React from 'react';
import Home from './pages/Home';
import LoginView from './components/LoginView';
import { InventoryProvider, useInventory } from './context/ShopContext';

// Auth Wrapper to conditionally render Login or Home
const MainLayout = () => {
  const { currentUser } = useInventory();
  return currentUser ? <Home /> : <LoginView />;
};

function App() {
  return (
    <InventoryProvider>
       <MainLayout />
    </InventoryProvider>
  );
}

export default App;
