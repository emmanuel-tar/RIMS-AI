
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Setup
const dbPath = path.resolve(__dirname, 'rims.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the RIMS SQLite database.');
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Inventory Table
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      sku TEXT,
      name TEXT,
      category TEXT,
      costPrice REAL,
      sellingPrice REAL,
      stockQuantity INTEGER,
      lowStockThreshold INTEGER,
      stockDistribution TEXT,
      batches TEXT,
      supplier TEXT,
      lastUpdated TEXT,
      locationPrices TEXT,
      barcode TEXT
    )`);

    // Transactions Table
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT,
      itemId TEXT,
      quantity INTEGER,
      reason TEXT,
      timestamp TEXT,
      userName TEXT,
      locationId TEXT,
      toLocationId TEXT,
      customerId TEXT
    )`);

    // Suppliers Table
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT,
      contactPerson TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      rating REAL
    )`);

    // Employees Table
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      role TEXT,
      assignedLocationId TEXT,
      phone TEXT,
      status TEXT
    )`);

    // Customers Table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      loyaltyPoints INTEGER,
      totalSpent REAL,
      lastVisit TEXT,
      notes TEXT
    )`);

    // Expenses Table
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT,
      amount REAL,
      category TEXT,
      date TEXT,
      locationId TEXT,
      recordedBy TEXT,
      supplierId TEXT
    )`);

    // Purchase Orders Table
    db.run(`CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      supplierId TEXT,
      status TEXT,
      dateCreated TEXT,
      dateExpected TEXT,
      items TEXT,
      totalCost REAL,
      notes TEXT,
      invoiceNumber TEXT
    )`);
  });
}

// --- API Endpoints ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'sqlite' });
});

// Inventory Routes
app.get('/api/inventory', (req, res) => {
  db.all("SELECT * FROM inventory", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON fields
    const items = rows.map(row => ({
      ...row,
      stockDistribution: JSON.parse(row.stockDistribution || '{}'),
      batches: JSON.parse(row.batches || '[]'),
      locationPrices: JSON.parse(row.locationPrices || '{}')
    }));
    res.json(items);
  });
});

app.post('/api/inventory', (req, res) => {
  const item = req.body;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO inventory (id, sku, name, category, costPrice, sellingPrice, stockQuantity, lowStockThreshold, stockDistribution, batches, supplier, lastUpdated, locationPrices, barcode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    item.id, item.sku, item.name, item.category, item.costPrice, item.sellingPrice, item.stockQuantity, 
    item.lowStockThreshold, JSON.stringify(item.stockDistribution), JSON.stringify(item.batches), 
    item.supplier, item.lastUpdated, JSON.stringify(item.locationPrices), item.barcode,
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item saved', id: item.id });
    }
  );
  stmt.finalize();
});

app.delete('/api/inventory/:id', (req, res) => {
  db.run("DELETE FROM inventory WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Item deleted' });
  });
});

// Transaction Routes
app.get('/api/transactions', (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 1000", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const tx = req.body;
  const stmt = db.prepare(`
    INSERT INTO transactions (id, type, itemId, quantity, reason, timestamp, userName, locationId, toLocationId, customerId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(tx.id, tx.type, tx.itemId, tx.quantity, tx.reason, tx.timestamp, tx.userName, tx.locationId, tx.toLocationId, tx.customerId, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Transaction logged' });
  });
  stmt.finalize();
});

// Sales Process (Batch)
app.post('/api/sales', (req, res) => {
  const { transactions, inventoryUpdates, customerUpdate } = req.body;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Log Transactions
    const txStmt = db.prepare(`
      INSERT INTO transactions (id, type, itemId, quantity, reason, timestamp, userName, locationId, toLocationId, customerId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    transactions.forEach(tx => {
      txStmt.run(tx.id, tx.type, tx.itemId, tx.quantity, tx.reason, tx.timestamp, tx.userName, tx.locationId, tx.toLocationId, tx.customerId);
    });
    txStmt.finalize();

    // 2. Update Inventory
    const invStmt = db.prepare(`
      UPDATE inventory SET 
        stockQuantity = ?, 
        stockDistribution = ?, 
        batches = ?, 
        lastUpdated = ?
      WHERE id = ?
    `);
    inventoryUpdates.forEach(update => {
      invStmt.run(update.stockQuantity, JSON.stringify(update.stockDistribution), JSON.stringify(update.batches), update.lastUpdated, update.id);
    });
    invStmt.finalize();

    // 3. Update Customer
    if (customerUpdate) {
      const custStmt = db.prepare(`
        UPDATE customers SET loyaltyPoints = ?, totalSpent = ?, lastVisit = ? WHERE id = ?
      `);
      custStmt.run(customerUpdate.loyaltyPoints, customerUpdate.totalSpent, customerUpdate.lastVisit, customerUpdate.id);
      custStmt.finalize();
    }

    db.run("COMMIT", (err) => {
      if (err) {
        console.error("Transaction Error", err);
        db.run("ROLLBACK");
        return res.status(500).json({ error: 'Transaction failed' });
      }
      res.json({ success: true });
    });
  });
});

// Purchase Order Specific Routes
app.get('/api/purchase_orders', (req, res) => {
  db.all("SELECT * FROM purchase_orders", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const pos = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items || '[]')
    }));
    res.json(pos);
  });
});

app.post('/api/purchase_orders', (req, res) => {
  const po = req.body;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO purchase_orders (id, supplierId, status, dateCreated, dateExpected, items, totalCost, notes, invoiceNumber)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    po.id, po.supplierId, po.status, po.dateCreated, po.dateExpected, JSON.stringify(po.items), 
    po.totalCost, po.notes, po.invoiceNumber,
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'PO saved', id: po.id });
    }
  );
  stmt.finalize();
});

// Generic GET/POST for simple entities
['suppliers', 'employees', 'customers', 'expenses'].forEach(table => {
  app.get(`/api/${table}`, (req, res) => {
    db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  app.post(`/api/${table}`, (req, res) => {
    const data = req.body;
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
    
    db.run(sql, Object.values(data), (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Record saved', id: data.id });
    });
  });

  app.delete(`/api/${table}/:id`, (req, res) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id], (err) => {
       if (err) return res.status(500).json({ error: err.message });
       res.json({ message: 'Record deleted' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`RIMS Local Database Server running on http://localhost:${PORT}`);
});
