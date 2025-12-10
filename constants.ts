
import { InventoryItem, Category, Location, Supplier, Employee, Customer, Expense } from './types';

export const MOCK_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Main Warehouse', type: 'WAREHOUSE', address: '123 Logistics Way' },
  { id: 'loc-2', name: 'Downtown Store', type: 'STORE', address: '45 High St' },
  { id: 'loc-3', name: 'North Branch', type: 'STORE', address: '789 North Ave' }
];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'TechSupply Co',
    contactPerson: 'John Tech',
    email: 'contact@techsupply.co',
    phone: '555-0101',
    address: '123 Silicon Ave, San Jose, CA',
    rating: 4.8
  },
  {
    id: 'sup-2',
    name: 'FashionWholesale',
    contactPerson: 'Sarah Style',
    email: 'orders@fashionwholesale.com',
    phone: '555-0102',
    address: '456 Fashion Dist, New York, NY',
    rating: 4.2
  },
  {
    id: 'sup-3',
    name: 'HomeGoods Inc',
    contactPerson: 'Mike Home',
    email: 'sales@homegoods.inc',
    phone: '555-0103',
    address: '789 Warehouse Blvd, Chicago, IL',
    rating: 3.9
  },
  {
    id: 'sup-4',
    name: 'GlobalFoods',
    contactPerson: 'Elena Food',
    email: 'sales@globalfoods.com',
    phone: '555-0104',
    address: '321 Market St, Seattle, WA',
    rating: 4.5
  },
  {
    id: 'sup-5',
    name: 'OfficeDepot',
    contactPerson: 'David Desk',
    email: 'b2b@officedepot.fake',
    phone: '555-0105',
    address: '654 Corp Park, Austin, TX',
    rating: 4.0
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Alice Manager',
    email: 'alice@rims.local',
    role: 'ADMIN',
    status: 'ACTIVE'
  },
  {
    id: 'emp-2',
    name: 'Bob Cashier',
    email: 'bob@rims.local',
    role: 'CASHIER',
    assignedLocationId: 'loc-2',
    status: 'ACTIVE'
  },
  {
    id: 'emp-3',
    name: 'Charlie Stock',
    email: 'charlie@rims.local',
    role: 'MANAGER',
    assignedLocationId: 'loc-1',
    status: 'ACTIVE'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-1234',
    loyaltyPoints: 120,
    totalSpent: 450.50,
    lastVisit: '2023-10-15T10:30:00Z'
  },
  {
    id: 'cust-2',
    name: 'John Smith',
    phone: '555-5678',
    loyaltyPoints: 45,
    totalSpent: 120.00,
    lastVisit: '2023-11-01T14:20:00Z'
  },
  {
    id: 'cust-3',
    name: 'VIP Client',
    email: 'vip@example.com',
    phone: '555-9999',
    loyaltyPoints: 1500,
    totalSpent: 5200.00,
    lastVisit: '2023-11-05T09:15:00Z'
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    description: 'Monthly Rent - Downtown',
    amount: 2500,
    category: 'RENT',
    date: new Date(new Date().setDate(1)).toISOString(), // 1st of current month
    locationId: 'loc-2',
    recordedBy: 'Alice Manager'
  },
  {
    id: 'exp-2',
    description: 'Electricity Bill',
    amount: 340.50,
    category: 'UTILITIES',
    date: new Date(new Date().setDate(5)).toISOString(),
    locationId: 'loc-1',
    recordedBy: 'Alice Manager'
  },
  {
    id: 'exp-3',
    description: 'Store Cleaning',
    amount: 150,
    category: 'MAINTENANCE',
    date: new Date(new Date().setDate(10)).toISOString(),
    locationId: 'loc-2',
    recordedBy: 'Alice Manager'
  }
];

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    sku: 'ELEC-001',
    name: 'Wireless Barcode Scanner',
    description: 'Bluetooth enabled handheld scanner with 15m range.',
    category: Category.Electronics,
    costPrice: 45.00,
    sellingPrice: 89.99,
    stockQuantity: 124,
    stockDistribution: { 'loc-1': 100, 'loc-2': 15, 'loc-3': 9 },
    lowStockThreshold: 15,
    supplier: 'TechSupply Co',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    sku: 'CLOTH-055',
    name: 'Cotton Crew Neck T-Shirt (L)',
    description: 'Premium organic cotton t-shirt, color Black.',
    category: Category.Clothing,
    costPrice: 8.50,
    sellingPrice: 24.99,
    stockQuantity: 4,
    stockDistribution: { 'loc-1': 0, 'loc-2': 2, 'loc-3': 2 },
    lowStockThreshold: 10,
    supplier: 'FashionWholesale',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    sku: 'HOME-102',
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 matte finish ceramic mugs.',
    category: Category.Home,
    costPrice: 12.00,
    sellingPrice: 35.00,
    stockQuantity: 45,
    stockDistribution: { 'loc-1': 20, 'loc-2': 15, 'loc-3': 10 },
    lowStockThreshold: 5,
    supplier: 'HomeGoods Inc',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    sku: 'OFF-778',
    name: 'Ergonomic Office Chair',
    description: 'Mesh back support with adjustable lumbar.',
    category: Category.Office,
    costPrice: 110.00,
    sellingPrice: 249.99,
    stockQuantity: 8,
    stockDistribution: { 'loc-1': 5, 'loc-2': 1, 'loc-3': 2 },
    lowStockThreshold: 3,
    supplier: 'OfficeDepot',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '5',
    sku: 'GROC-999',
    name: 'Arabica Coffee Beans (1kg)',
    description: 'Dark roast whole beans imported from Colombia.',
    category: Category.Groceries,
    costPrice: 14.00,
    sellingPrice: 28.50,
    stockQuantity: 82,
    stockDistribution: { 'loc-1': 50, 'loc-2': 20, 'loc-3': 12 },
    lowStockThreshold: 20,
    supplier: 'GlobalFoods',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '6',
    sku: 'ELEC-204',
    name: 'USB-C Charging Cable (2m)',
    description: 'Braided nylon fast charging cable.',
    category: Category.Electronics,
    costPrice: 2.50,
    sellingPrice: 12.99,
    stockQuantity: 250,
    stockDistribution: { 'loc-1': 150, 'loc-2': 50, 'loc-3': 50 },
    lowStockThreshold: 50,
    supplier: 'TechSupply Co',
    lastUpdated: new Date().toISOString()
  },
  {
    id: '7',
    sku: 'CLOTH-022',
    name: 'Denim Jeans (32/32)',
    description: 'Straight fit vintage wash denim.',
    category: Category.Clothing,
    costPrice: 22.00,
    sellingPrice: 65.00,
    stockQuantity: 18,
    stockDistribution: { 'loc-1': 10, 'loc-2': 4, 'loc-3': 4 },
    lowStockThreshold: 10,
    supplier: 'FashionWholesale',
    lastUpdated: new Date().toISOString()
  }
];
