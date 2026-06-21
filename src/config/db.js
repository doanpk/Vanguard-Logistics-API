const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database Connection Failed! Bad Config: ", err);
  } else {
    console.log("Connected to SQLite Database");
    initDB();
  }
});

function initDB() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        address TEXT,
        full_name TEXT,
        phone_number TEXT,
        avatar_url TEXT,
        balance REAL DEFAULT 0,
        vehicle_info TEXT,
        store_banner TEXT,
        rating REAL DEFAULT 5.0,
        lat REAL,
        lng REAL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS MenuItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(store_id) REFERENCES Users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS Orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        driver_id INTEGER,
        store_id INTEGER,
        pickup_address TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        item_description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        total_price REAL,
        delivery_fee REAL,
        lat REAL,
        lng REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS OrderMessages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(order_id) REFERENCES Orders(id)
      )
    `);

    // Migration for existing database
    db.run(`ALTER TABLE Users ADD COLUMN address TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN full_name TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN phone_number TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN avatar_url TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN balance REAL DEFAULT 0`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN vehicle_info TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN store_banner TEXT`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN rating REAL DEFAULT 5.0`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN lat REAL`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN lng REAL`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN is_open INTEGER DEFAULT 1`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN is_locked INTEGER DEFAULT 0`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Users ADD COLUMN category TEXT DEFAULT 'Thêm'`, (err) => { /* ignore if exists */ });

    db.run(`ALTER TABLE Orders ADD COLUMN store_id INTEGER`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Orders ADD COLUMN total_price REAL`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Orders ADD COLUMN delivery_fee REAL`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Orders ADD COLUMN lat REAL`, (err) => { /* ignore if exists */ });
    db.run(`ALTER TABLE Orders ADD COLUMN lng REAL`, (err) => { /* ignore if exists */ });
  });
}

const dbPromise = {
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = { db, dbPromise };
