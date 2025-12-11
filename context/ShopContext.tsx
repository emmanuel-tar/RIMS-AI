
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { InventoryItem, Transaction, DashboardStats, Location, Supplier, PurchaseOrder, StoreSettings, Employee, Customer, CloudSettings, SyncStatus, FeatureModule, Expense, InventoryBatch, Product, HeldOrder, CashShift, PaymentMethod, BeforeInstallPromptEvent, Toast } from '../types';
import { MOCK_INVENTORY, MOCK_LOCATIONS, MOCK_SUPPLIERS, MOCK_EMPLOYEES, MOCK_CUSTOMERS, MOCK_EXPENSES, SUPPORTED_CURRENCIES } from '../constants';

// Dynamic Server URL: Checks LocalStorage first (set via Settings), else defaults to localhost
const getBaseUrl = () => {
  const stored = localStorage.getItem('rims_server_url');
  return stored || 'http://localhost:3001/api';
};

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
  heldOrders: HeldOrder[];
  
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
  bulkAdjustStock: (adjustments: { id: string, quantityChange: number }[], locationId: string, reason: string) => void;
  transferStock: (itemId: string, fromLocationId: string, toLocationId: string, quantity: number) => void;
  commitAudit: (locationId: string, adjustments: { itemId: string, systemQty: number, countedQty: number }[]) => void;
  processSale: (locationId: string, items: { itemId: string, quantity: number }[], customerId?: string, discount?: number, pointsRedeemed?: number, note?: string, paymentMethod?: PaymentMethod) => Transaction;
  processRefund: (originalTxId: string, locationId: string, items: { itemId: string, quantity: number }[], restock: boolean, paymentMethod?: PaymentMethod) => void;

  // Suppliers & POs
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'status' | 'dateCreated' | 'totalCost'>) => void;
  receivePurchaseOrder: (id: string, locationId: string, invoiceNumber: string, batchDetails?: Record<string, { batchNumber: string, expiryDate: string }>) => void;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Employees & CRM
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addCustomer: (cust: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  
  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  
  // Held Orders
  holdOrder: (order: Omit<HeldOrder, 'id' | 'timestamp'>) => void;
  deleteHeldOrder: (id: string) => void;
  
  // Cash Management
  currentShift: CashShift | null;
  openShift: (startAmount: number, locationId: string) => void;
  closeShift: (endAmount: number, notes?: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  exportData: () => void;
  getPriceForLocation: (item: InventoryItem, locationId: string) => number;
  generateSku: (category: string) => string;
  formatCurrency: (amount: number) => string;
  
  // Network Config
  serverUrl: string;
  setServerUrl: (url: string) => void;

  // PWA
  deferredPrompt: BeforeInstallPromptEvent | null;
  installApp: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [serverUrl, setServerUrlState] = useState(getBaseUrl());
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [locations, setLocations] = useState<Location[]>(MOCK_LOCATIONS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  
  // Cash Shift State
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('DISCONNECTED');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocalServerConnected, setIsLocalServerConnected] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'RIMS Retail',
    currencySymbol: '₦',
    currencyCode: 'NGN',
    taxRate: 0.075,
    supportEmail: 'admin@rims.local',
    loyaltyEnabled: true,
    loyaltyEarnRate: 100, // Spend 100 NGN to earn 1 point
    loyaltyRedeemRate: 1, // 1 point = 1 NGN
    cloud: {
      enabled: false,
      apiEndpoint: 'https://api.rims-cloud.com/v1',
      storeId: '',
      apiKey: ''
    },
    hardware: {
      receiptPrinterWidth: '80mm',
      autoPrintReceipt: true,
      labelSize: 'standard',
      showCashDrawerButton: true,
      selectedPrinterId: 'p5',
      useA4Printer: false,
      receiptCopies: 1,
      autoPrintKitchen: false
    },
    receiptTemplate: {
      showLogo: false,
      logoUrl: '',
      headerText: 'Welcome to RIMS Retail',
      footerText: 'Thank you for shopping with us!\nNo returns without receipt.',
      showCashier: true,
      showTaxBreakdown: true,
      barcodeAtBottom: true,
      includeAddress: true,
      includePhone: true,
      includeName: true
    },
    labelTemplate: {
      size: '2x1-roll',
      showPrice: true,
      showName: true,
      showSKU: true,
      showBarcode: true
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

  // Helper to update server URL and reload to apply
  const setServerUrl = (url: string) => {
    localStorage.setItem('rims_server_url', url);
    setServerUrlState(url);
    window.location.reload(); // Force reload to reconnect
  };

  // --- API HELPERS ---
  const fetchFromServer = async (endpoint: string) => {
    try {
      const res = await fetch(`${serverUrl}/${endpoint}`);
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (error) {
      console.warn(`Failed to fetch ${endpoint} from ${serverUrl}`);
      return null;
    }
  };

  const postToServer = async (endpoint: string, data: any) => {
    if (!isLocalServerConnected) return;
    try {
      await fetch(`${serverUrl}/${endpoint}`, {
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
    // PWA Install Event Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const initializeData = async () => {
      // 1. Check for Local Node Server
      try {
        const health = await fetch(`${serverUrl}/health`);
        if (health.ok) {
          setIsLocalServerConnected(true);
          console.log(`🔗 Connected to Database at ${serverUrl}`);
          setSyncStatus('CONNECTED');
          
          // Load from Server
          const [inv, tx, sup, emp, cust, exp, pos, shifts] = await Promise.all([
            fetchFromServer('inventory'),
            fetchFromServer('transactions'),
            fetchFromServer('suppliers'),
            fetchFromServer('employees'),
            fetchFromServer('customers'),
            fetchFromServer('expenses'),
            fetchFromServer('purchase_orders'),
            fetchFromServer('cash_shifts')
          ]);

          if (inv) setInventory(inv);
          if (tx) setTransactions(tx);
          if (sup) setSuppliers(sup);
          if (emp) setEmployees(emp);
          if (cust) setCustomers(cust);
          if (exp) setExpenses(exp);
          if (pos) setPurchaseOrders(pos);
          if (shifts) {
             setCashShifts(shifts);
             // Find open shift
             const open = shifts.find((s: CashShift) => s.status === 'OPEN');
             if(open) setCurrentShift(open);
          }
          
          return; // Exit if server loaded
        }
      } catch (e) {
        console.log(`⚠️ Database not detected at ${serverUrl}. Using Browser Storage.`);
        setSyncStatus('DISCONNECTED');
      }

      // 2. Fallback to LocalStorage
      const savedInv = localStorage.getItem('rims_inventory');
      setInventory(savedInv ? JSON.parse(savedInv) : MOCK_INVENTORY);
      
      setSuppliers(MOCK_SUPPLIERS);
      setEmployees(MOCK_EMPLOYEES);
      setCustomers(MOCK_CUSTOMERS);
      setExpenses(MOCK_EXPENSES);
      
      const savedPOs = localStorage.getItem('rims_pos');
      if (savedPOs) setPurchaseOrders(JSON.parse(savedPOs));
      
      const savedShifts = localStorage.getItem('rims_shifts');
      if(savedShifts) {
         const parsed = JSON.parse(savedShifts);
         setCashShifts(parsed);
         const open = parsed.find((s: CashShift) => s.status === 'OPEN');
         if(open) setCurrentShift(open);
      }
    };

    initializeData();

    // Load User Session & Held Orders
    const savedUser = localStorage.getItem('rims_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    
    const savedHeld = localStorage.getItem('rims_held_orders');
    if (savedHeld) setHeldOrders(JSON.parse(savedHeld));

  }, [serverUrl]);

  // --- PERSISTENCE EFFECT (Local Storage Fallback) ---
  useEffect(() => {
    if (!isLocalServerConnected) {
      localStorage.setItem('rims_inventory', JSON.stringify(inventory));
    }
  }, [inventory, isLocalServerConnected]);
  
  useEffect(() => {
    if (!isLocalServerConnected) {
      localStorage.setItem('rims_pos', JSON.stringify(purchaseOrders));
    }
  }, [purchaseOrders, isLocalServerConnected]);
  
  useEffect(() => {
    localStorage.setItem('rims_held_orders', JSON.stringify(heldOrders));
  }, [heldOrders]);
  
  useEffect(() => {
    if(!isLocalServerConnected) {
        localStorage.setItem('rims_shifts', JSON.stringify(cashShifts));
    }
  }, [cashShifts, isLocalServerConnected]);

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

  const addToast = (message: string, type: Toast['type'] = 'INFO') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const installApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  const login = (email: string): boolean => {
    const user = employees.find(e => e.email.toLowerCase() === email.toLowerCase() && e.status === 'ACTIVE');
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('rims_user', JSON.stringify(user));
      addToast(`Welcome back, ${user.name}`, 'SUCCESS');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rims_user');
    addToast('Signed out successfully', 'INFO');
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

  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    addToast('Settings updated', 'SUCCESS');
  };
  
  const toggleFeature = (feature: FeatureModule, isEnabled: boolean) => {
    setSettings(prev => ({ ...prev, features: { ...prev.features, [feature]: isEnabled } }));
    addToast(`${feature} module ${isEnabled ? 'enabled' : 'disabled'}`, 'INFO');
  };
  
  const updateCloudSettings = (updates: Partial<CloudSettings>) => {
     setSettings(prev => ({ ...prev, cloud: { ...(prev.cloud || { enabled: false, apiEndpoint: '', storeId: '', apiKey: '' }), ...updates } }));
  };

  const triggerSync = async () => {
    // Re-check connection
    try {
        const health = await fetch(`${serverUrl}/health`);
        if(health.ok) {
            setSyncStatus('CONNECTED');
            window.location.reload();
        } else {
            setSyncStatus('ERROR');
            addToast('Connection failed', 'ERROR');
        }
    } catch(e) {
        setSyncStatus('ERROR');
        addToast('Connection failed', 'ERROR');
    }
  };

  const addLocation = (locationData: Omit<Location, 'id'>) => {
    const newLocation: Location = { ...locationData, id: `loc-${Date.now()}` };
    setLocations(prev => [...prev, newLocation]);
    addToast(`Location "${locationData.name}" added`, 'SUCCESS');
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
    addToast(`${newItem.name} added to inventory`, 'SUCCESS');
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
    addToast('Item updated', 'SUCCESS');
  };

  const deleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    if (isLocalServerConnected) {
       fetch(`${serverUrl}/inventory/${id}`, { method: 'DELETE' });
    }
    addToast('Item deleted', 'INFO');
  };

  const adjustStock = (id: string, locationId: string, quantityChange: number, reason: string, batchInfo?: { batchNumber: string, expiryDate: string }) => {
    const timestamp = new Date().toISOString();
    let updatedItem: InventoryItem | null = null;

    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const currentLocStock = item.stockDistribution[locationId] || 0;
        const newLocStock = Math.max(0, currentLocStock + quantityChange);
        const newDistribution = { ...item.stockDistribution, [locationId]: newLocStock };
        const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);

        let newBatches = item.batches ? [...item.batches] : [];
        // Handle FEFO deduction or Batch Addition
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
        } else if (quantityChange > 0 && batchInfo) {
           newBatches.push({
             id: `bat-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
             batchNumber: batchInfo.batchNumber,
             expiryDate: batchInfo.expiryDate,
             quantity: quantityChange,
             locationId: locationId
           });
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
      type: quantityChange > 0 ? 'RESTOCK' : (reason.toLowerCase().includes('sale') ? 'SALE' : (reason === 'Audit Correction' ? 'AUDIT' : 'ADJUSTMENT')),
      itemId: id,
      quantity: Math.abs(quantityChange),
      reason,
      timestamp,
      userName: currentUser?.name || 'Admin',
      locationId: locationId
    };
    setTransactions(prev => [transaction, ...prev]);
    if (isLocalServerConnected) postToServer('transactions', transaction);
    
    if (Math.abs(quantityChange) > 0) {
        addToast(`Stock ${quantityChange > 0 ? 'added' : 'deducted'} successfully`, 'SUCCESS');
    }
  };

  const bulkAdjustStock = (adjustments: { id: string, quantityChange: number }[], locationId: string, reason: string) => {
    const timestamp = new Date().toISOString();
    const inventoryUpdates: InventoryItem[] = [];
    const newTransactions: Transaction[] = [];
    
    // Batch Update Local State
    setInventory(prev => prev.map(item => {
        const adj = adjustments.find(a => a.id === item.id);
        if (adj && adj.quantityChange !== 0) {
            const currentLocStock = item.stockDistribution[locationId] || 0;
            const newLocStock = Math.max(0, currentLocStock + adj.quantityChange);
            const newDistribution = { ...item.stockDistribution, [locationId]: newLocStock };
            const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);
            
            const updatedItem = {
                ...item,
                stockDistribution: newDistribution,
                stockQuantity: newTotal,
                lastUpdated: timestamp
            };
            
            inventoryUpdates.push(updatedItem);

            // Create Transaction Record
            newTransactions.push({
                id: `TX-${Date.now()}-${Math.random().toString(36).substr(2,5)}`,
                type: adj.quantityChange > 0 ? 'RESTOCK' : (reason.includes('Audit') ? 'AUDIT' : 'ADJUSTMENT'),
                itemId: item.id,
                quantity: Math.abs(adj.quantityChange),
                reason: reason,
                timestamp,
                userName: currentUser?.name || 'Admin',
                locationId
            });

            return updatedItem;
        }
        return item;
    }));

    setTransactions(prev => [...newTransactions, ...prev]);

    // Batch Update Server
    if (isLocalServerConnected) {
        fetch(`${serverUrl}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactions: newTransactions,
              inventoryUpdates,
              customerUpdate: null
            })
        });
    }
    addToast(`${adjustments.length} items adjusted`, 'SUCCESS');
  };

  const transferStock = (itemId: string, fromLocationId: string, toLocationId: string, quantity: number) => {
    // Logic similar to adjustStock but updates two locations. 
    adjustStock(itemId, fromLocationId, -quantity, `Transfer Out to ${toLocationId}`);
    adjustStock(itemId, toLocationId, quantity, `Transfer In from ${fromLocationId}`);
    addToast('Stock transfer complete', 'SUCCESS');
  };

  const commitAudit = (locationId: string, adjustments: { itemId: string, systemQty: number, countedQty: number }[]) => {
    adjustments.forEach(adj => {
       const diff = adj.countedQty - adj.systemQty;
       if (diff !== 0) {
           adjustStock(adj.itemId, locationId, diff, 'Audit Correction');
       }
    });
    addToast('Audit results committed', 'SUCCESS');
  };

  const processSale = (
    locationId: string, 
    items: { itemId: string, quantity: number }[], 
    customerId?: string, 
    discountPercent?: number, 
    pointsRedeemed?: number, 
    note?: string, 
    paymentMethod: PaymentMethod = 'CASH'
  ): Transaction => {
    const timestamp = new Date().toISOString();
    let totalSaleValue = 0;

    const inventoryUpdates: InventoryItem[] = [];
    const transactionsToLog: Transaction[] = [];

    // Calculate Master ID
    const masterTxId = `TX-${Date.now()}`;
    const txReason = `POS Sale (${paymentMethod}) ${discountPercent ? `(-${discountPercent}%)` : ''} ${note ? `| Note: ${note}` : ''}`;

    // 1. Prepare Inventory Updates
    setInventory(prev => prev.map(item => {
      const saleItem = items.find(i => i.itemId === item.id);
      if (saleItem) {
        const itemPrice = getPriceForLocation(item, locationId);
        totalSaleValue += itemPrice * saleItem.quantity;

        const currentLocStock = item.stockDistribution[locationId] || 0;
        const newLocStock = Math.max(0, currentLocStock - saleItem.quantity);
        
        // Low Stock Alert Check
        if (newLocStock <= item.lowStockThreshold && currentLocStock > item.lowStockThreshold) {
            // Trigger toast alert for low stock
            addToast(`Low Stock Alert: ${item.name} is down to ${newLocStock} units at this location.`, 'WARNING');
        }
        
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
        reason: txReason,
        timestamp,
        userName: currentUser?.name || 'Staff',
        locationId: locationId,
        customerId,
        paymentMethod
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

    // 4. Update Shift (if open)
    if (currentShift && currentShift.locationId === locationId && currentShift.status === 'OPEN') {
       const updatedShift = {
          ...currentShift,
          cashSales: paymentMethod === 'CASH' ? currentShift.cashSales + finalTotal : currentShift.cashSales,
          cardSales: paymentMethod === 'CARD' ? currentShift.cardSales + finalTotal : currentShift.cardSales
       };
       setCurrentShift(updatedShift);
       setCashShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
       if (isLocalServerConnected) postToServer('cash_shifts', updatedShift);
    }

    // 5. Send Batch to Server
    if (isLocalServerConnected) {
      fetch(`${serverUrl}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactionsToLog,
          inventoryUpdates,
          customerUpdate
        })
      });
    }
    
    addToast('Sale processed successfully', 'SUCCESS');

    return { id: masterTxId, type: 'SALE', itemId: 'MULTI', quantity: items.length, timestamp, userName: currentUser?.name || 'Staff', locationId, paymentMethod };
  };

  const processRefund = (
    originalTxId: string, 
    locationId: string, 
    items: { itemId: string, quantity: number }[], 
    restock: boolean, 
    paymentMethod: PaymentMethod = 'CASH'
  ) => {
    const timestamp = new Date().toISOString();
    const transactionsToLog: Transaction[] = [];
    const inventoryUpdates: InventoryItem[] = [];
    const refundReason = `Refund for TX: ${originalTxId}`;
    
    // 1. Process Items
    items.forEach(refundItem => {
        // Log Refund Transaction
        transactionsToLog.push({
            id: `REF-${Date.now()}`,
            type: 'REFUND',
            itemId: refundItem.itemId,
            quantity: refundItem.quantity,
            reason: refundReason,
            timestamp,
            userName: currentUser?.name || 'Staff',
            locationId,
            paymentMethod
        });

        // Restock Inventory if needed
        if (restock) {
            setInventory(prev => prev.map(invItem => {
                if (invItem.id === refundItem.itemId) {
                    const currentLocStock = invItem.stockDistribution[locationId] || 0;
                    const newLocStock = currentLocStock + refundItem.quantity;
                    const newDistribution = { ...invItem.stockDistribution, [locationId]: newLocStock };
                    const newTotal = Object.values(newDistribution).reduce((a: number, b: number) => a + b, 0);
                    
                    const updated = {
                        ...invItem,
                        stockDistribution: newDistribution,
                        stockQuantity: newTotal,
                        lastUpdated: timestamp
                    };
                    inventoryUpdates.push(updated);
                    return updated;
                }
                return invItem;
            }));
        }
    });

    setTransactions(prev => [...transactionsToLog, ...prev]);

    // 2. Calculate Refund Value (Approximate based on current price for MVP)
    const refundValue = items.reduce((sum, item) => {
        const inv = inventory.find(i => i.id === item.itemId);
        return sum + (item.quantity * (inv ? getPriceForLocation(inv, locationId) : 0));
    }, 0);

    // 3. Update Shift (Net Sales adjustment)
    if (currentShift && currentShift.locationId === locationId && currentShift.status === 'OPEN') {
        const updatedShift = {
           ...currentShift,
           cashSales: paymentMethod === 'CASH' ? currentShift.cashSales - refundValue : currentShift.cashSales,
           cardSales: paymentMethod === 'CARD' ? currentShift.cardSales - refundValue : currentShift.cardSales
        };
        setCurrentShift(updatedShift);
        setCashShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
        if (isLocalServerConnected) postToServer('cash_shifts', updatedShift);
    }
    
    // 4. Reverse Loyalty if original TX had customer (Complex, need lookup. For MVP skip or implement simpler logic)
    // Finding original transaction to get customer ID
    const originalTx = transactions.find(t => t.id === originalTxId);
    let customerUpdate: Customer | null = null;
    
    if (originalTx?.customerId) {
        const pointsToReverse = Math.floor(refundValue / (settings.loyaltyEarnRate || 1));
        setCustomers(prev => prev.map(c => {
            if (c.id === originalTx.customerId) {
                const updated = {
                    ...c,
                    totalSpent: Math.max(0, c.totalSpent - refundValue),
                    loyaltyPoints: Math.max(0, c.loyaltyPoints - pointsToReverse)
                };
                customerUpdate = updated;
                return updated;
            }
            return c;
        }));
    }

    // 5. Sync to Server
    if (isLocalServerConnected) {
        // Re-use sales endpoint for batch update or create a new one. 
        // Using sales endpoint structure works as it handles transactions and inventory updates generally.
        fetch(`${serverUrl}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactions: transactionsToLog,
              inventoryUpdates,
              customerUpdate
            })
        });
    }
    addToast('Refund processed successfully', 'INFO');
  };

  // --- HELD ORDERS ---
  const holdOrder = (orderData: Omit<HeldOrder, 'id' | 'timestamp'>) => {
    const newHold: HeldOrder = {
      ...orderData,
      id: `hold-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setHeldOrders(prev => [newHold, ...prev]);
    addToast('Order held successfully', 'INFO');
  };

  const deleteHeldOrder = (id: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== id));
  };
  
  // --- CASH SHIFTS ---
  const openShift = (startAmount: number, locationId: string) => {
    const newShift: CashShift = {
       id: `shift-${Date.now()}`,
       locationId,
       openedBy: currentUser?.name || 'Staff',
       startTime: new Date().toISOString(),
       startAmount,
       status: 'OPEN',
       cashSales: 0,
       cardSales: 0
    };
    setCurrentShift(newShift);
    setCashShifts(prev => [newShift, ...prev]);
    if(isLocalServerConnected) postToServer('cash_shifts', newShift);
    addToast('Shift opened', 'SUCCESS');
  };
  
  const closeShift = (endAmount: number, notes?: string) => {
    if(!currentShift) return;
    
    // Expected = Start + Sales. (Expenses could be subtracted here if tracked as cash payouts)
    const expectedAmount = currentShift.startAmount + currentShift.cashSales;
    
    const closedShift: CashShift = {
       ...currentShift,
       closedBy: currentUser?.name || 'Staff',
       endTime: new Date().toISOString(),
       endAmount,
       expectedAmount,
       notes,
       status: 'CLOSED'
    };
    
    setCashShifts(prev => prev.map(s => s.id === currentShift.id ? closedShift : s));
    setCurrentShift(null);
    if(isLocalServerConnected) postToServer('cash_shifts', closedShift);
    addToast('Shift closed', 'INFO');
  };

  // --- ENTITY CRUD (Generic) ---
  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const ns = { ...s, id: Date.now().toString() };
    setSuppliers(prev => [...prev, ns]);
    if (isLocalServerConnected) postToServer('suppliers', ns);
    addToast('Supplier added', 'SUCCESS');
  };
  const updateSupplier = (id: string, u: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...u } : s));
    if (isLocalServerConnected) postToServer('suppliers', { id, ...u });
    addToast('Supplier updated', 'SUCCESS');
  };

  const addEmployee = (e: Omit<Employee, 'id'>) => {
    const ne = { ...e, id: `emp-${Date.now()}` };
    setEmployees(prev => [...prev, ne]);
    if (isLocalServerConnected) postToServer('employees', ne);
    addToast('Employee added', 'SUCCESS');
  };
  const updateEmployee = (id: string, u: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...u } : e));
    if (isLocalServerConnected) postToServer('employees', { id, ...u });
    addToast('Employee updated', 'SUCCESS');
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'loyaltyPoints' | 'totalSpent'>) => {
    const nc = { ...c, id: `cust-${Date.now()}`, loyaltyPoints: 0, totalSpent: 0 };
    setCustomers(prev => [...prev, nc]);
    if (isLocalServerConnected) postToServer('customers', nc);
    addToast('Customer added', 'SUCCESS');
  };
  const updateCustomer = (id: string, u: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...u } : c));
    if (isLocalServerConnected) postToServer('customers', { id, ...u });
    addToast('Customer updated', 'SUCCESS');
  };

  const addExpense = (e: Omit<Expense, 'id'>) => {
    const ne = { ...e, id: `exp-${Date.now()}` };
    setExpenses(prev => [...prev, ne]);
    if (isLocalServerConnected) postToServer('expenses', ne);
    addToast('Expense recorded', 'SUCCESS');
  };
  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (isLocalServerConnected) fetch(`${serverUrl}/expenses/${id}`, { method: 'DELETE' });
    addToast('Expense deleted', 'INFO');
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'status' | 'dateCreated' | 'totalCost'>) => {
    const newPO: PurchaseOrder = { 
        ...poData, 
        id: `PO-${Date.now()}`, 
        status: 'ORDERED', 
        dateCreated: new Date().toISOString(), 
        totalCost: 0 
    }; 
    // totalCost calculation logic should be here or handled in component
    let calculatedCost = 0;
    if(poData.items) {
        calculatedCost = poData.items.reduce((sum: number, i) => sum + (i.quantity * i.costPrice), 0);
    }
    newPO.totalCost = calculatedCost;
    
    setPurchaseOrders(prev => [newPO, ...prev]);
    if (isLocalServerConnected) postToServer('purchase_orders', newPO);
    addToast('Purchase order created', 'SUCCESS');
  };
  
  const receivePurchaseOrder = (id: string, locationId: string, invoiceNumber: string, batchDetails?: any) => {
      const po = purchaseOrders.find(p => p.id === id);
      if(po) {
          // 1. Adjust Stock
          po.items.forEach((item: any) => {
              const specificBatch = batchDetails?.[item.itemId];
              adjustStock(
                  item.itemId, 
                  locationId, 
                  item.quantity, 
                  `PO Received: ${id} | Invoice: ${invoiceNumber}`,
                  specificBatch 
              );
          });
          
          // 2. Update PO Status and add Invoice Number
          const updatedPO = { ...po, status: 'RECEIVED' as const, invoiceNumber };
          setPurchaseOrders(prev => prev.map(p => p.id === id ? updatedPO : p));
          if (isLocalServerConnected) postToServer('purchase_orders', updatedPO);
          addToast('Stock received from PO', 'SUCCESS');
      }
  };

  const updatePurchaseOrderStatus = (id: string, status: any) => {
      setPurchaseOrders(prev => prev.map(p => {
          if (p.id === id) {
              const updated = { ...p, status };
              if (isLocalServerConnected) postToServer('purchase_orders', updated);
              return updated;
          }
          return p;
      }));
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
    addToast('Export started', 'INFO');
  };

  return (
    <InventoryContext.Provider value={{
      inventory, locations, transactions, suppliers, purchaseOrders, employees, customers, expenses, stats, settings, currentUser, syncStatus,
      isLocalServerConnected, heldOrders,
      triggerSync, updateCloudSettings, login, logout, updateSettings, toggleFeature, addLocation, addItem, updateItem, deleteItem,
      adjustStock, bulkAdjustStock, transferStock, commitAudit, processSale, processRefund, addSupplier, updateSupplier, createPurchaseOrder, receivePurchaseOrder,
      updatePurchaseOrderStatus, addEmployee, updateEmployee, addCustomer, updateCustomer, addExpense, deleteExpense,
      holdOrder, deleteHeldOrder,
      searchQuery, setSearchQuery, exportData, getPriceForLocation, generateSku, formatCurrency, serverUrl, setServerUrl,
      currentShift, openShift, closeShift,
      deferredPrompt, installApp,
      toasts, addToast, removeToast
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
