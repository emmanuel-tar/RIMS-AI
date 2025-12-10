
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

export interface StoreSettings {
  storeName: string;
  currencySymbol: string;
  taxRate: number; // e.g. 0.08 for 8%
  supportEmail: string;
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
