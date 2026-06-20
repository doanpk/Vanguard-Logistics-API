const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

async function seed() {
  console.log("Bắt đầu nạp dữ liệu Seed...");
  const saltRounds = 10;
  const hash = await bcrypt.hash("123456", saltRounds);

  db.serialize(() => {
    // 1. Xóa dữ liệu cũ (Tùy chọn, ở đây ta cứ Insert thêm)
    
    // 2. Insert Quán ăn
    const insertStore = db.prepare(`INSERT INTO Users (username, password_hash, role, address, lat, lng, full_name, rating, balance) VALUES (?, ?, 'store', ?, ?, ?, ?, 5.0, 0)`);
    insertStore.run('hungky', hash, '450 Lê Văn Việt, Q9', 10.8458, 106.7941, 'Cơm Hưng Ký');
    insertStore.run('mixue', hash, '460 Lê Văn Việt, Q9', 10.8465, 106.7932, 'MIXUE');
    insertStore.run('bundau', hash, '100 Man Thiện, Q9', 10.8421, 106.7911, 'Bún Đậu Chị Đại');
    insertStore.finalize();

    // 3. Insert Khách hàng
    const insertCust = db.prepare(`INSERT INTO Users (username, password_hash, role, full_name, phone_number, lat, lng, balance) VALUES (?, ?, 'customer', ?, ?, ?, ?, ?)`);
    insertCust.run('sv1', hash, 'Nam Ký Túc Xá', '0901234567', 10.8432, 106.7955, 500000);
    insertCust.finalize();

    // 4. Insert Tài xế
    const insertDriver = db.prepare(`INSERT INTO Users (username, password_hash, role, full_name, vehicle_info, balance) VALUES (?, ?, 'driver', ?, ?, ?)`);
    insertDriver.run('tx1', hash, 'Trần Văn Be', '59-X1 12345', 0);
    insertDriver.finalize();

    // 5. Lấy ID của quán để chèn Menu
    db.all(`SELECT id, username FROM Users WHERE role = 'store'`, (err, rows) => {
      if (err) throw err;
      const insertMenu = db.prepare(`INSERT INTO MenuItems (store_id, name, price, description) VALUES (?, ?, ?, ?)`);
      
      rows.forEach(row => {
        if (row.username === 'hungky') {
          insertMenu.run(row.id, 'Cơm Tấm Sườn Bì', 35000, 'Không dưa leo, nhiều cơm');
          insertMenu.run(row.id, 'Cơm Gà Xối Mỡ', 40000, 'Thêm tóp mỡ');
        } else if (row.username === 'mixue') {
          insertMenu.run(row.id, 'Trà Tắc Khổng Lồ', 15000, 'Ít ngọt, đá để riêng');
          insertMenu.run(row.id, 'Kem Ốc Quế', 10000, '');
        } else if (row.username === 'bundau') {
          insertMenu.run(row.id, 'Bún đậu thập cẩm', 50000, 'Nhiều mắm tôm');
        }
      });
      
      insertMenu.finalize();
      console.log("Seed dữ liệu đậm chất sinh viên thành công! 🚀");
      db.close();
    });
  });
}

seed();
