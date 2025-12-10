
export enum Category {
  Electronics = 'Electronics',
  Clothing = 'Clothing',
  Home = 'Home',
  Groceries = 'Groceries',
  Office = 'Office'
}

export interface Location {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'STORE';
  address: string;
}

export interface CloudSettings {
  enabled: boolean;
  apiEndpoint: string;
  storeId: string;
  apiKey: string;
  lastSync?: string;
}

export type SyncStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';

export type FeatureModule = 'CRM' | 'TEAM' | 'SUPPLIERS' | 'MULTI_LOCATION' | 'CLOUD' | 'AI_ASSISTANT' | 'REPORTS' | 'FINANCE';

export interface StoreSettings {
  storeName: string;
  currencySymbol: string;
  taxRate: number; // e.g. 0.08 for 8%
  supportEmail: string;
  loyaltyEnabled?: boolean;
  loyaltyEarnRate?: number; // Spend amount to earn 1 point
  loyaltyRedeemRate?: number; // Value of 1 point
  cloud?: CloudSettings;
  features: Record<FeatureModule, boolean>;
}

export interface InventoryBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  locationId: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode?: string; // EAN/UPC
  name: string;
  description: string;
  category: Category;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number; // Total across all locations
  stockDistribution: Record<string, number>; // locationId -> quantity
  lowStockThreshold: number;
  supplier: string;
  lastUpdated: string;
  expiryDate?: string; // Earliest expiry date across batches
  locationPrices?: Record<string, number>; // locationId -> price override
  batches?: InventoryBatch[];
}

export interface Transaction {
  id: string;
  type: 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'TRANSFER' | 'AUDIT';
  itemId: string;
  quantity: number;
  reason?: string;
  timestamp: string;
  userName: string;
  locationId?: string; // Primary location affected
  toLocationId?: string; // For transfers
  customerId?: string;
}

export interface AuditSession {
  id: string;
  locationId: string;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  itemsScanned: number;
  totalVarianceValue: number;
}

export interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  categories: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  rating: number;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating: number; // 1-5
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  dateCreated: string;
  dateExpected?: string;
  items: { itemId: string; quantity: number; costPrice: number }[];
  totalCost: number;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  assignedLocationId?: string; // If restricted to one location
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'RENT' | 'UTILITIES' | 'SALARY' | 'MARKETING' | 'MAINTENANCE' | 'OTHER';
  date: string;
  locationId: string;
  recordedBy: string;
  supplierId?: string;
}
