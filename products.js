const sqlite3 = require('sqlite3').verbose();

// Connect to the database (creates products.db if it doesn't exist)
const db = new sqlite3.Database('products.db');

// Sample products array
const products = [
    { 
        "category": "Home Decor", 
        product: 'Rustic Wooden Wall Clock', 
        price: 39.99, 
        location: 'China', 
        warehouse: 'Shanghai Depot' 
    },
    { 
        category: 'Home Decor', 
        product: 'Vintage Table Lamp', 
        price: 49.99, 
        location: 'India', 
        warehouse: 'Delhi Home Goods' 
    },
    { 
        category: 'Home Decor', 
        product: 'Geometric Wall Art', 
        price: 29.99, 
        location: 'Vietnam', 
        warehouse: 'Ho Chi Minh City Art Depot' 
    },
    { 
        category: 'Fitness Equipment', 
        product: 'Adjustable Dumbbells', 
        price: 89.99, 
        location: 'Vietnam', 
        warehouse: 'Hanoi Fitness Warehouse' 
    },
    { 
        category: 'Fitness Equipment', 
        product: 'Yoga Mat with Strap', 
        price: 24.99, 
        location: 'China', 
        warehouse: 'Beijing Sports Hub' 
    },
    { 
        category: 'Fitness Equipment', 
        product: 'Resistance Bands Set', 
        price: 19.99, 
        location: 'Malaysia', 
        warehouse: 'Kuala Lumpur Sports Depot' 
    },
    { 
        category: 'Tech Gadgets', 
        product: 'Wireless Bluetooth Earbuds', 
        price: 59.99, 
        location: 'South Korea', 
        warehouse: 'Seoul Electronics Hub' 
    },
    { 
        category: 'Tech Gadgets', 
        product: 'Smartwatch with Fitness Tracker', 
        price: 89.99, 
        location: 'China', 
        warehouse: 'Shenzhen Tech Warehouse' 
    },
    { 
        category: 'Tech Gadgets', 
        product: 'Portable Solar Charger', 
        price: 34.99, 
        location: 'Thailand', 
        warehouse: 'Bangkok Electronics Depot' 
    },
    { 
        category: 'Beauty & Skincare', 
        product: 'Organic Aloe Vera Gel', 
        price: 19.99, 
        location: 'South Korea', 
        warehouse: 'Busan Skincare Depot' 
    }

    // Add more products here as needed...
];

// Function to create the products table (if it doesn't already exist)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    product TEXT,
    price REAL,
    location TEXT,
    warehouse TEXT
  )`);
  
  // Prepare the insert statement
  const stmt = db.prepare("INSERT INTO products (category, product, price, location, warehouse) VALUES (?, ?, ?, ?, ?)");

  // Loop through the products array and insert each product into the table
  products.forEach(product => {
    stmt.run(
      product.category, 
      product.product, 
      product.price, 
      product.location, 
      product.warehouse
    );
  });

  // Finalize the insert statement
  stmt.finalize();
  
  // Retrieve and print the inserted products to verify
  db.each("SELECT id, category, product, price, location, warehouse FROM products", (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`${row.id}: ${row.category} - ${row.product} ($${row.price})`);
    }
  });
});

// Close the database connection
db.close();
