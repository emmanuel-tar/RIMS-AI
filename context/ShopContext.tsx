
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { InventoryItem, Transaction, DashboardStats, Location, Supplier, PurchaseOrder, StoreSettings, Employee, Customer, CloudSettings, SyncStatus, FeatureModule } from '../types';
import { MOCK_INVENTORY, MOCK_LOCATIONS, MOCK_SUPPLIERS, MOCK_EMPLOYEES, MOCK_CUSTOMERS } from '../constants';

interface InventoryContextType {
  inventory: InventoryItem[];
  locations: Location[];
  transactions: Transaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  employees: Employee[];
  customers: Customer[];
  stats: DashboardStats;
  settings: StoreSettings;
  currentUser: Employee | null;
  
  // Cloud & Sync
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
  updateCloudSettings: (settings: Partial<CloudSettings>) => void;
  
  // Auth
  login: (email: string) => boolean;
  logout: () => void;

  updateSettings: (settings: Partial<StoreSettings>) => void;
  toggleFeature: (feature: FeatureModule, isEnabled: boolean) => void;
  
  addLocation: (location: Omit<Location, 'id'>) => void;
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'stockQuantity' | 'stockDistribution'>, initialStock: number, locationId: string) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  adjustStock: (id: string, locationId: string, quantityChange: number, reason: string) => void;
  transferStock: (itemId: string, fromLocationId: string, toLocationId: string, quantity: number) => void;
  commitAudit: (locationId: string, adjustments: { itemId: string, systemQty: number, countedQty: number }[]) => void;
  processSale: (locationId: string, items: { itemId: string, quantity: number }[], customerId?: string, discount?: number, pointsRedeemed?: number) => Transaction;
  
  // Suppliers & POs
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'status' | 'dateCreated' | 'totalCost'>) => void;
  receivePurchaseOrder: (id: string, locationId: string) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Employees & CRM
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addCustomer: (cust: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  exportData: () => void;
  getPriceForLocation: (item: InventoryItem, locationId: string) => number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('rims_inventory');
    return saved ? JSON.parse(saved) : MOCK_INVENTORY;
  });
  
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  
  // Cloud State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('CONNECTED');

  const [searchQuery, setSearchQuery] = useState('');
  
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'RIMS Retail',
    currencySymbol: '$',
    taxRate: 0.08,
    supportEmail: 'admin@rims.local',
    loyaltyEnabled: true,
    loyaltyEarnRate: 1, // $1 = 1 point
    loyaltyRedeemRate: 0.01, // 1 point = $0.01
    cloud: {
      enabled: false,
      apiEndpoint: 'https://api.rims-cloud.com/v1',
      storeId: '',
      apiKey: ''
    },
    features: {
      CRM: true,
      TEAM: true,
      SUPPLIERS: true,
      MULTI_LOCATION: true,
      CLOUD: false,
      AI_ASSISTANT: true,
      REPORTS: true
    }
  });

  // Persistence effect
  useEffect(() => {
    localStorage.setItem('rims_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Try to restore session
  useEffect(() => {
    const savedUser = localStorage.getItem('rims_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Monitor Online Status
  useEffect(() => {
    const handleOnline = () => setSyncStatus('CONNECTED');
    const handleOffline = () => setSyncStatus('DISCONNECTED');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const stats = useMemo(() => {
    return {
      totalItems: inventory.reduce((acc, item) => acc + item.stockQuantity, 0),
      totalValue: inventory.reduce((acc, item) => acc + (item.stockQuantity * item.sellingPrice), 0),
      lowStockCount: inventory.filter(item => item.stockQuantity <= item.lowStockThreshold).length,
      categories: new Set(inventory.map(i => i.category)).size
    };
  }, [inventory]);

  const login = (email: string): boolean => {
    const user = employees.find(e => e.email.toLowerCase() === email.toLowerCase() && e.status === 'ACTIVE');
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('rims_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rims_user');
  };

  const getPriceForLocation = (item: InventoryItem, locationId: string): number => {
    if (item.locationPrices && item.locationPrices[locationId]) {
      return item.locationPrices[locationId];
    }
    return item.sellingPrice;
  };

  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleFeature = (feature: FeatureModule, isEnabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: isEnabled
      }
    }));
  };

  const updateCloudSettings = (updates: Partial<CloudSettings>) => {
     setSettings(prev => ({
       ...prev,
       cloud: { ...(prev.cloud || { enabled: false, apiEndpoint: '', storeId: '', apiKey: '' }), ...updates }
     }));
  };

  const triggerSync = async () => {
    if (!settings.cloud?.enabled) return;
    setSyncStatus('SYNCING');
    
    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    updateCloudSettings({ lastSync: new Date().toISOString() });
    setSyncStatus('CONNECTED');
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
      userName: currentUser?.name || 'Admin',
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
      userName: currentUser?.name || 'Admin',
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
      userName: currentUser?.name || 'Admin',
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
        userName: currentUser?.name || 'Admin',
        locationId: locationId
      }));

    setTransactions(prev => [...newTransactions, ...prev]);
  };

  const processSale = (
    locationId: string, 
    items: { itemId: string, quantity: number }[], 
    customerId?: string, 
    discountPercent?: number, 
    pointsRedeemed?: number
  ): Transaction => {
    const timestamp = new Date().toISOString();
    let totalSaleValue = 0;

    // Batch update stock
    setInventory(prev => prev.map(item => {
      const saleItem = items.find(i => i.itemId === item.id);
      if (saleItem) {
        const itemPrice = getPriceForLocation(item, locationId);
        totalSaleValue += itemPrice * saleItem.quantity;

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

    // Calculate Financials for Loyalty
    const discountAmount = discountPercent ? totalSaleValue * (discountPercent / 100) : 0;
    const redemptionValue = pointsRedeemed ? pointsRedeemed * (settings.loyaltyRedeemRate || 0.01) : 0;
    const finalTotal = Math.max(0, totalSaleValue - discountAmount - redemptionValue);
    
    // Generate Master Transaction ID
    const masterTxId = `TX-${Date.now()}`;

    // Generate Transactions (Audit Trail)
    const newTransactions: Transaction[] = items.map(item => ({
      id: masterTxId,
      type: 'SALE',
      itemId: item.itemId,
      quantity: item.quantity,
      reason: `POS Sale ${discountPercent ? `(-${discountPercent}%)` : ''}`,
      timestamp,
      userName: currentUser?.name || 'Staff',
      locationId: locationId,
      customerId
    }));

    setTransactions(prev => [...newTransactions, ...prev]);

    // Update Customer Loyalty
    if (customerId) {
      const pointsEarned = Math.floor(finalTotal / (settings.loyaltyEarnRate || 1));
      
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? {
          ...c,
          totalSpent: c.totalSpent + finalTotal,
          loyaltyPoints: Math.max(0, c.loyaltyPoints - (pointsRedeemed || 0) + pointsEarned),
          lastVisit: timestamp
        } : c
      ));
    }

    // Return a summary transaction object for the receipt
    return {
      id: masterTxId,
      type: 'SALE',
      itemId: 'MULTI', // Placeholder
      quantity: items.length,
      timestamp,
      userName: currentUser?.name || 'Staff',
      locationId
    };
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
         adjustStock(poItem.itemId, locationId, poItem.quantity, `PO Received: ${po.id}`);
       }
    });
  };

  // --- Employees & CRM ---
  const addEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp = { ...emp, id: `emp-${Date.now()}` };
    setEmployees(prev => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addCustomer = (cust: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent'>) => {
    const newCust = { ...cust, id: `cust-${Date.now()}`, loyaltyPoints: 0, totalSpent: 0 };
    setCustomers(prev => [...prev, newCust]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
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
      employees,
      customers,
      stats,
      settings,
      currentUser,
      syncStatus,
      triggerSync,
      updateCloudSettings,
      login,
      logout,
      updateSettings,
      toggleFeature,
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
      addEmployee,
      updateEmployee,
      addCustomer,
      updateCustomer,
      searchQuery,
      setSearchQuery,
      exportData,
      getPriceForLocation
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

// Dummy hook for legacy components
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
