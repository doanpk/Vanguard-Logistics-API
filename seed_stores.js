const { dbPromise } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function seed() {
  const hash = await bcrypt.hash('123456', 10);
  
  // Set default categories for existing stores
  await dbPromise.run(`UPDATE Users SET category = 'Cơm' WHERE username IN ('hungky', 'bundau')`);
  await dbPromise.run(`UPDATE Users SET category = 'Trà Sữa' WHERE username IN ('Highlands', 'mixue')`);

  // New stores to seed
  const newStores = [
    { user: 'KFC', cat: 'FastFood', address: '123 Lê Văn Việt, Q9' },
    { user: 'McDonalds', cat: 'FastFood', address: '456 Xa Lộ Hà Nội, Q9' },
    { user: 'PhucLong', cat: 'Trà Sữa', address: 'Vincom Q9' },
    { user: 'ComTamMoc', cat: 'Cơm', address: '789 Đỗ Xuân Hợp, Q9' }
  ];

  for (let s of newStores) {
    try {
      // Check if already exists
      const exists = await dbPromise.get(`SELECT id FROM Users WHERE username = ?`, [s.user]);
      if (exists) {
        console.log('Skipping existing', s.user);
        continue;
      }
      
      // Generate random coordinates around UTC2 (10.845, 106.794)
      const lat = 10.845 + (Math.random() * 0.01);
      const lng = 106.794 + (Math.random() * 0.01);
      
      await dbPromise.run(`INSERT INTO Users (username, password_hash, role, address, category, is_open, lat, lng) VALUES (?, ?, 'store', ?, ?, 1, ?, ?)`, [s.user, hash, s.address, s.cat, lat, lng]);
      console.log('Inserted', s.user);
      
      const res = await dbPromise.get(`SELECT id FROM Users WHERE username = ?`, [s.user]);
      const storeId = res.id;
      
      // insert menu items
      await dbPromise.run(`INSERT INTO MenuItems (store_id, name, price) VALUES (?, ?, ?)`, [storeId, s.user + ' Món 1', 45000]);
      await dbPromise.run(`INSERT INTO MenuItems (store_id, name, price) VALUES (?, ?, ?)`, [storeId, s.user + ' Món 2', 60000]);
    } catch(e) {
      console.log('Error inserting', s.user, e.message);
    }
  }
  console.log('Seed Done!');
  process.exit(0);
}

seed();
