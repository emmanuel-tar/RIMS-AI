
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { InventoryItem, Transaction, DashboardStats, Location, Supplier, PurchaseOrder, StoreSettings, Employee, Customer, CloudSettings, SyncStatus, FeatureModule, Expense, InventoryBatch, Product } from '../types';
import { MOCK_INVENTORY, MOCK_LOCATIONS, MOCK_SUPPLIERS, MOCK_EMPLOYEES, MOCK_CUSTOMERS, MOCK_EXPENSES } from '../constants';

const SERVER_URL = 'http://localhost:3001/api';

interface InventoryContextType {
  inventory: InventoryItem[];
  locations: Location[];
  transactions: Transaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  employees: Employee[];
  customers: Customer[];
  expenses: Expense[];
  stats: DashboardStats;
  settings: StoreSettings;
  currentUser: Employee | null;
  
  // Cloud & Sync
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
  updateCloudSettings: (settings: Partial<CloudSettings>) => void;
  isLocalServerConnected: boolean;
  
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
  receivePurchaseOrder: (id: string, locationId: string, batchDetails?: Record<string, { batchNumber: string, expiryDate: string }>) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Employees & CRM
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addCustomer: (cust: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  
  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  exportData: () => void;
  getPriceForLocation: (item: InventoryItem, locationId: string) => number;
  generateSku: (category: string) => string;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('DISCONNECTED');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocalServerConnected, setIsLocalServerConnected] = useState(false);

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'RIMS Retail',
    currencySymbol: '$',
    taxRate: 0.08,
    supportEmail: 'admin@rims.local',
    loyaltyEnabled: true,
    loyaltyEarnRate: 1,
    loyaltyRedeemRate: 0.01,
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
      REPORTS: true,
      FINANCE: true
    }
  });

  // --- API HELPERS ---
  const fetchFromServer = async (endpoint: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/${endpoint}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.warn(`Failed to fetch ${endpoint} from local server.`);
      return null;
    }
  };

  const postToServer = async (endpoint: string, data: any) => {
    if (!isLocalServerConnected) return;
    try {
      await fetch(`${SERVER_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Failed to post to ${endpoint}`, error);
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const initializeData = async () => {
      // 1. Check for Local Node Server
      try {
        const health = await fetch(`${SERVER_URL}/health`);
        if (health.ok) {
          setIsLocalServerConnected(true);
          console.log("🔗 Connected to Local Node.js Database");
          
          // Load from Server
          const [inv, tx, sup, emp, cust, exp] = await Promise.all([
            fetchFromServer('inventory'),
            fetchFromServer('transactions'),
            fetchFromServer('suppliers'),
            fetchFromServer('employees'),
            fetchFromServer('customers'),
            fetchFromServer('expenses')
          ]);

          if (inv) setInventory(inv);
          if (tx) setTransactions(tx);
          if (sup) setSuppliers(sup);
          if (emp) setEmployees(emp);
          if (cust) setCustomers(cust);
          if (exp) setExpenses(exp);
          
          return; // Exit if server loaded
        }
      } catch (e) {
        console.log("⚠️ Local Node Server not detected. Using Browser Storage.");
      }

      // 2. Fallback to LocalStorage
      const savedInv = localStorage.getItem('rims_inventory');
      setInventory(savedInv ? JSON.parse(savedInv) : MOCK_INVENTORY);
      
      setSuppliers(MOCK_SUPPLIERS);
      setEmployees(MOCK_EMPLOYEES);
      setCustomers(MOCK_CUSTOMERS);
      setExpenses(MOCK_EXPENSES);
    };

    initializeData();

    // Load User Session
    const savedUser = localStorage.getItem('rims_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

  }, []);

  // --- PERSISTENCE EFFECT (Local Storage Fallback) ---
  useEffect(() => {
    if (!isLocalServerConnected) {
      localStorage.setItem('rims_inventory', JSON.stringify(inventory));
    }
  }, [inventory, isLocalServerConnected]);

  // --- COMPUTED STATS ---
  const stats = useMemo(() => {
    return {
      totalItems: inventory.reduce((acc, item) => acc + item.stockQuantity, 0),
      totalValue: inventory.reduce((acc, item) => acc + (item.stockQuantity * item.sellingPrice), 0),
      lowStockCount: inventory.filter(item => item.stockQuantity <= item.lowStockThreshold).length,
      categories: new Set(inventory.map(i => i.category)).size
    };
  }, [inventory]);

  // --- ACTION HANDLERS ---

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

  const generateSku = (category: string): string => {
    const prefix = category.slice(0, 3).toUpperCase();
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    let maxNum = 0;
    
    inventory.forEach(item => {
      const match = item.sku.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    return `${prefix}-${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  const updateSettings = (updates: Partial<StoreSettings>) => setSettings(prev => ({ ...prev, ...updates }));
  const toggleFeature = (feature: FeatureModule, isEnabled: boolean) => {
    setSettings(prev => ({ ...prev, features: { ...prev.features, [feature]: isEnabled } }));
  };
  const updateCloudSettings = (updates: Partial<CloudSettings>) => {
     setSettings(prev => ({ ...prev, cloud: { ...(prev.cloud || { enabled: false, apiEndpoint: '', storeId: '', apiKey: '' }), ...updates } }));
  };

  const triggerSync = async () => {
    if (!settings.cloud?.enabled) return;
    setSyncStatus('SYNCING');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateCloudSettings({ lastSync: new Date().toISOString() });
    setSyncStatus('CONNECTED');
  };

  const addLocation = (locationData: Omit<Location, 'id'>) => {
    const newLocation: Location = { ...locationData, id: `loc-${Date.now()}` };
    setLocations(prev => [...prev, newLocation]);
  };

  // INVENTORY ACTIONS
  const addItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'stockQuantity' | 'stockDistribution'>, initialStock: number, locationId: string) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString(),
      stockQuantity: initialStock,
      stockDistribution: { [locationId]: initialStock },
      lastUpdated: new Date().toISOString()
    };
    locations.forEach(loc => { if (loc.id !== locationId) newItem.stockDistribution[loc.id] = 0; });

    setInventory(prev => [newItem, ...prev]);
    if (isLocalServerConnected) postToServer('inventory', newItem);
    
    // Log Transaction
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
    if (isLocalServerConnected) postToServer('transactions', transaction);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    const timestamp = new Date().toISOString();
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates, lastUpdated: timestamp };
        if (isLocalServerConnected) postToServer('inventory', updated);
        return updated;
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    if (isLocalServerConnected) {
       fetch(`${SERVER_URL}/inventory/${id}`, { method: 'DELETE' });
    }
  };

  const adjustStock = (id: string, locationId: string, quantityChange: number, reason: string) => {
    const timestamp = new Date().toISOString();
    let updatedItem: InventoryItem | null = null;

    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const currentLocStock = item.stockDistribution[locationId] || 0;
        const newLocStock = Math.max(0, currentLocStock + quantityChange);
        const newDistribution = { ...item.stockDistribution, [locationId]: newLocStock };
        const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);

        let newBatches = item.batches || [];
        if (quantityChange < 0 && newBatches.length > 0) {
           let qtyToRemove = Math.abs(quantityChange);
           newBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
           newBatches = newBatches.map(b => {
             if (b.locationId === locationId && qtyToRemove > 0 && b.quantity > 0) {
               const take = Math.min(b.quantity, qtyToRemove);
               qtyToRemove -= take;
               return { ...b, quantity: b.quantity - take };
             }
             return b;
           }).filter(b => b.quantity > 0);
        }

        updatedItem = {
          ...item,
          stockDistribution: newDistribution,
          stockQuantity: newTotal,
          lastUpdated: timestamp,
          batches: newBatches
        };
        return updatedItem;
      }
      return item;
    }));

    if (updatedItem && isLocalServerConnected) postToServer('inventory', updatedItem);

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: quantityChange > 0 ? 'RESTOCK' : (reason.toLowerCase().includes('sale') ? 'SALE' : 'ADJUSTMENT'),
      itemId: id,
      quantity: Math.abs(quantityChange),
      reason,
      timestamp,
      userName: currentUser?.name || 'Admin',
      locationId: locationId
    };
    setTransactions(prev => [transaction, ...prev]);
    if (isLocalServerConnected) postToServer('transactions', transaction);
  };

  const transferStock = (itemId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    // Logic similar to adjustStock but updates two locations. 
    // For brevity, we update state optimistically. In a full implementation, we'd sync this update.
    adjustStock(itemId, fromLocationId, -quantity, `Transfer Out to ${toLocationId}`);
    adjustStock(itemId, toLocationId, quantity, `Transfer In from ${fromLocationId}`);
  };

  const commitAudit = (locationId: string, adjustments: { itemId: string, systemQty: number, countedQty: number }[]) => {
    adjustments.forEach(adj => {
       adjustStock(adj.itemId, locationId, adj.countedQty - adj.systemQty, 'Audit Correction');
    });
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

    const inventoryUpdates: InventoryItem[] = [];
    const transactionsToLog: Transaction[] = [];

    // Calculate Master ID
    const masterTxId = `TX-${Date.now()}`;

    // 1. Prepare Inventory Updates
    setInventory(prev => prev.map(item => {
      const saleItem = items.find(i => i.itemId === item.id);
      if (saleItem) {
        const itemPrice = getPriceForLocation(item, locationId);
        totalSaleValue += itemPrice * saleItem.quantity;

        const currentLocStock = item.stockDistribution[locationId] || 0;
        const newLocStock = Math.max(0, currentLocStock - saleItem.quantity);
        
        const newDistribution = { ...item.stockDistribution, [locationId]: newLocStock };
        const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);

        let newBatches = item.batches ? [...item.batches] : [];
        if (newBatches.length > 0) {
           let qtyToDeduct = saleItem.quantity;
           newBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
           newBatches = newBatches.map(b => {
             if (b.locationId === locationId && qtyToDeduct > 0 && b.quantity > 0) {
                const deduction = Math.min(b.quantity, qtyToDeduct);
                qtyToDeduct -= deduction;
                return { ...b, quantity: b.quantity - deduction };
             }
             return b;
           }).filter(b => b.quantity > 0);
        }

        const updated = {
          ...item,
          stockDistribution: newDistribution,
          stockQuantity: newTotal,
          lastUpdated: timestamp,
          batches: newBatches
        };
        inventoryUpdates.push(updated);
        return updated;
      }
      return item;
    }));

    // 2. Prepare Transactions
    items.forEach(item => {
      transactionsToLog.push({
        id: masterTxId,
        type: 'SALE',
        itemId: item.itemId,
        quantity: item.quantity,
        reason: `POS Sale ${discountPercent ? `(-${discountPercent}%)` : ''}`,
        timestamp,
        userName: currentUser?.name || 'Staff',
        locationId: locationId,
        customerId
      });
    });

    setTransactions(prev => [...transactionsToLog, ...prev]);

    // 3. Customer Logic
    let customerUpdate: Customer | null = null;
    const discountAmount = discountPercent ? totalSaleValue * (discountPercent / 100) : 0;
    const redemptionValue = pointsRedeemed ? pointsRedeemed * (settings.loyaltyRedeemRate || 0.01) : 0;
    const finalTotal = Math.max(0, totalSaleValue - discountAmount - redemptionValue);

    if (customerId) {
      const pointsEarned = Math.floor(finalTotal / (settings.loyaltyEarnRate || 1));
      setCustomers(prev => prev.map(c => {
        if (c.id === customerId) {
          const updated = {
            ...c,
            totalSpent: c.totalSpent + finalTotal,
            loyaltyPoints: Math.max(0, c.loyaltyPoints - (pointsRedeemed || 0) + pointsEarned),
            lastVisit: timestamp
          };
          customerUpdate = updated;
          return updated;
        }
        return c;
      }));
    }

    // 4. Send Batch to Server
    if (isLocalServerConnected) {
      fetch(`${SERVER_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactionsToLog,
          inventoryUpdates,
          customerUpdate
        })
      });
    }

    return { id: masterTxId, type: 'SALE', itemId: 'MULTI', quantity: items.length, timestamp, userName: currentUser?.name || 'Staff', locationId };
  };

  // --- ENTITY CRUD (Generic) ---
  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const ns = { ...s, id: Date.now().toString() };
    setSuppliers(prev => [...prev, ns]);
    if (isLocalServerConnected) postToServer('suppliers', ns);
  };
  const updateSupplier = (id: string, u: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...u } : s));
    if (isLocalServerConnected) postToServer('suppliers', { id, ...u });
  };

  const addEmployee = (e: Omit<Employee, 'id'>) => {
    const ne = { ...e, id: `emp-${Date.now()}` };
    setEmployees(prev => [...prev, ne]);
    if (isLocalServerConnected) postToServer('employees', ne);
  };
  const updateEmployee = (id: string, u: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...u } : e));
    if (isLocalServerConnected) postToServer('employees', { id, ...u });
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent'>) => {
    const nc = { ...c, id: `cust-${Date.now()}`, loyaltyPoints: 0, totalSpent: 0 };
    setCustomers(prev => [...prev, nc]);
    if (isLocalServerConnected) postToServer('customers', nc);
  };
  const updateCustomer = (id: string, u: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...u } : c));
    if (isLocalServerConnected) postToServer('customers', { id, ...u });
  };

  const addExpense = (e: Omit<Expense, 'id'>) => {
    const ne = { ...e, id: `exp-${Date.now()}` };
    setExpenses(prev => [...prev, ne]);
    if (isLocalServerConnected) postToServer('expenses', ne);
  };
  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (isLocalServerConnected) fetch(`${SERVER_URL}/expenses/${id}`, { method: 'DELETE' });
  };

  const createPurchaseOrder = (poData: any) => {
    const newPO = { ...poData, id: `PO-${Date.now()}`, status: 'ORDERED', dateCreated: new Date().toISOString(), totalCost: 0 }; // simplified
    setPurchaseOrders(prev => [newPO, ...prev]);
  };
  
  const receivePurchaseOrder = (id: string, locationId: string, batchDetails?: any) => {
      const po = purchaseOrders.find(p => p.id === id);
      if(po) {
          po.items.forEach((item: any) => {
              adjustStock(item.itemId, locationId, item.quantity, `PO Received: ${id}`);
          });
          setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status: 'RECEIVED' } : p));
      }
  };

  const updatePurchaseOrderStatus = (id: string, status: any) => {
      setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const exportData = () => {
    const headers = ['SKU', 'Name', 'Category', 'Stock'];
    const rows = inventory.map(item => [item.sku, item.name, item.category, item.stockQuantity]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <InventoryContext.Provider value={{
      inventory, locations, transactions, suppliers, purchaseOrders, employees, customers, expenses, stats, settings, currentUser, syncStatus,
      isLocalServerConnected,
      triggerSync, updateCloudSettings, login, logout, updateSettings, toggleFeature, addLocation, addItem, updateItem, deleteItem,
      adjustStock, transferStock, commitAudit, processSale, addSupplier, updateSupplier, createPurchaseOrder, receivePurchaseOrder,
      updatePurchaseOrderStatus, addEmployee, updateEmployee, addCustomer, updateCustomer, addExpense, deleteExpense,
      searchQuery, setSearchQuery, exportData, getPriceForLocation, generateSku
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

// Dummy hook for compatibility with legacy components
export const useShop = () => {
   return { 
      cart: [] as (Product & { quantity: number })[], 
      isCartOpen: false, 
      toggleCart: () => {}, 
      addToCart: (product: Product) => {}, 
      removeFromCart: (id: string) => {}, 
      updateQuantity: (id: string, quantity: number) => {}, 
      resetFilter: () => {} 
   };
};
