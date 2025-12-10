
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { InventoryItem, Transaction, DashboardStats, Location, Supplier, PurchaseOrder, StoreSettings } from '../types';
import { MOCK_INVENTORY, MOCK_LOCATIONS, MOCK_SUPPLIERS } from '../constants';

interface InventoryContextType {
  inventory: InventoryItem[];
  locations: Location[];
  transactions: Transaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  stats: DashboardStats;
  settings: StoreSettings;
  updateSettings: (settings: Partial<StoreSettings>) => void;
  addLocation: (location: Omit<Location, 'id'>) => void;
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'stockQuantity' | 'stockDistribution'>, initialStock: number, locationId: string) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  adjustStock: (id: string, locationId: string, quantityChange: number, reason: string) => void;
  transferStock: (itemId: string, fromLocationId: string, toLocationId: string, quantity: number) => void;
  commitAudit: (locationId: string, adjustments: { itemId: string, systemQty: number, countedQty: number }[]) => void;
  processSale: (locationId: string, items: { itemId: string, quantity: number }[]) => void;
  
  // Suppliers & POs
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'status' | 'dateCreated' | 'totalCost'>) => void;
  receivePurchaseOrder: (id: string, locationId: string) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  exportData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'RIMS Retail',
    currencySymbol: '$',
    taxRate: 0.08,
    supportEmail: 'admin@rims.local'
  });

  const stats = useMemo(() => {
    return {
      totalItems: inventory.reduce((acc, item) => acc + item.stockQuantity, 0),
      totalValue: inventory.reduce((acc, item) => acc + (item.stockQuantity * item.sellingPrice), 0),
      lowStockCount: inventory.filter(item => item.stockQuantity <= item.lowStockThreshold).length,
      categories: new Set(inventory.map(i => i.category)).size
    };
  }, [inventory]);

  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const addLocation = (locationData: Omit<Location, 'id'>) => {
    const newLocation: Location = {
      ...locationData,
      id: `loc-${Date.now()}`
    };
    setLocations(prev => [...prev, newLocation]);
  };

  const addItem = (
    itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'stockQuantity' | 'stockDistribution'>, 
    initialStock: number, 
    locationId: string
  ) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString(),
      stockQuantity: initialStock,
      stockDistribution: { [locationId]: initialStock },
      lastUpdated: new Date().toISOString()
    };
    
    // Initialize other locations with 0
    locations.forEach(loc => {
      if (loc.id !== locationId) newItem.stockDistribution[loc.id] = 0;
    });

    setInventory(prev => [newItem, ...prev]);
    
    const transaction: Transaction = {
      id: Date.now().toString() + 't',
      type: 'RESTOCK',
      itemId: newItem.id,
      quantity: initialStock,
      reason: 'Initial Stock',
      timestamp: new Date().toISOString(),
      userName: 'Admin',
      locationId: locationId
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const deleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const adjustStock = (id: string, locationId: string, quantityChange: number, reason: string) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const currentLocStock = item.stockDistribution[locationId] || 0;
        const newLocStock = Math.max(0, currentLocStock + quantityChange);
        
        const newDistribution = { ...item.stockDistribution, [locationId]: newLocStock };
        const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);

        return {
          ...item,
          stockDistribution: newDistribution,
          stockQuantity: newTotal,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: quantityChange > 0 ? 'RESTOCK' : (reason.toLowerCase().includes('sale') ? 'SALE' : 'ADJUSTMENT'),
      itemId: id,
      quantity: Math.abs(quantityChange),
      reason,
      timestamp: new Date().toISOString(),
      userName: 'Admin',
      locationId: locationId
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const transferStock = (itemId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const currentFrom = item.stockDistribution[fromLocationId] || 0;
        if (currentFrom < quantity) return item; // Prevent negative transfer

        const newDistribution = {
          ...item.stockDistribution,
          [fromLocationId]: currentFrom - quantity,
          [toLocationId]: (item.stockDistribution[toLocationId] || 0) + quantity
        };

        return {
          ...item,
          stockDistribution: newDistribution,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'TRANSFER',
      itemId: itemId,
      quantity: quantity,
      reason: 'Inter-branch Transfer',
      timestamp: new Date().toISOString(),
      userName: 'Admin',
      locationId: fromLocationId,
      toLocationId: toLocationId
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const commitAudit = (locationId: string, adjustments: { itemId: string, systemQty: number, countedQty: number }[]) => {
    const timestamp = new Date().toISOString();
    
    // Batch update items
    setInventory(prev => prev.map(item => {
      const adjustment = adjustments.find(a => a.itemId === item.id);
      if (adjustment) {
        const newDistribution = { ...item.stockDistribution, [locationId]: adjustment.countedQty };
        const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);
        
        return {
          ...item,
          stockDistribution: newDistribution,
          stockQuantity: newTotal,
          lastUpdated: timestamp
        };
      }
      return item;
    }));

    // Batch create transactions
    const newTransactions: Transaction[] = adjustments
      .filter(adj => adj.systemQty !== adj.countedQty)
      .map(adj => ({
        id: Date.now() + Math.random().toString(),
        type: 'AUDIT',
        itemId: adj.itemId,
        quantity: Math.abs(adj.countedQty - adj.systemQty),
        reason: `Audit Correction (System: ${adj.systemQty}, Counted: ${adj.countedQty})`,
        timestamp,
        userName: 'Admin',
        locationId: locationId
      }));

    setTransactions(prev => [...newTransactions, ...prev]);
  };

  const processSale = (locationId: string, items: { itemId: string, quantity: number }[]) => {
    const timestamp = new Date().toISOString();
    
    // Batch update stock
    setInventory(prev => prev.map(item => {
      const saleItem = items.find(i => i.itemId === item.id);
      if (saleItem) {
        const currentLocStock = item.stockDistribution[locationId] || 0;
        const newLocStock = Math.max(0, currentLocStock - saleItem.quantity);
        
        const newDistribution = { ...item.stockDistribution, [locationId]: newLocStock };
        const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);

        return {
          ...item,
          stockDistribution: newDistribution,
          stockQuantity: newTotal,
          lastUpdated: timestamp
        };
      }
      return item;
    }));

    // Generate Transactions
    const newTransactions: Transaction[] = items.map(item => ({
      id: Date.now() + Math.random().toString(),
      type: 'SALE',
      itemId: item.itemId,
      quantity: item.quantity,
      reason: 'POS Transaction',
      timestamp,
      userName: 'Staff',
      locationId: locationId
    }));

    setTransactions(prev => [...newTransactions, ...prev]);
  };

  // --- Suppliers & POs ---

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier = { ...supplier, id: Date.now().toString() };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'status' | 'dateCreated' | 'totalCost'>) => {
    const totalCost = poData.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const newPO: PurchaseOrder = {
      ...poData,
      id: `PO-${Date.now()}`,
      status: 'ORDERED',
      dateCreated: new Date().toISOString(),
      totalCost
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
  };

  const updatePurchaseOrderStatus = (id: string, status: PurchaseOrder['status']) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status } : po));
  };

  const receivePurchaseOrder = (id: string, locationId: string) => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po || po.status === 'RECEIVED') return;

    // Update PO Status
    updatePurchaseOrderStatus(id, 'RECEIVED');

    // Update Inventory
    po.items.forEach(poItem => {
       const existingItem = inventory.find(i => i.id === poItem.itemId);
       if (existingItem) {
         // Use adjustStock to handle logic and transaction creation
         adjustStock(poItem.itemId, locationId, poItem.quantity, `PO Received: ${po.id}`);
       }
    });
  };
  
  const exportData = () => {
    const headers = ['SKU', 'Name', 'Category', 'Cost Price', 'Selling Price', 'Total Stock', 'Supplier', 'Last Updated'];
    const rows = inventory.map(item => [
      item.sku,
      `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
      item.category,
      item.costPrice,
      item.sellingPrice,
      item.stockQuantity,
      item.supplier,
      item.lastUpdated
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rims_inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <InventoryContext.Provider value={{
      inventory,
      locations,
      transactions,
      suppliers,
      purchaseOrders,
      stats,
      settings,
      updateSettings,
      addLocation,
      addItem,
      updateItem,
      deleteItem,
      adjustStock,
      transferStock,
      commitAudit,
      processSale,
      addSupplier,
      updateSupplier,
      createPurchaseOrder,
      receivePurchaseOrder,
      updatePurchaseOrderStatus,
      searchQuery,
      setSearchQuery,
      exportData
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within an InventoryProvider");
  return context;
};

export const useShop = () => {
  return {
    cart: [] as any[],
    isCartOpen: false,
    toggleCart: () => {},
    addToCart: (item: any) => {},
    removeFromCart: (id: string) => {},
    updateQuantity: (id: string, qty: number) => {},
    resetFilter: () => {}
  };
};
