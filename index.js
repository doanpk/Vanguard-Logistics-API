require("dotenv").config();
const express = require("express");
const cors = require("cors");
const orderRoutes = require("./src/routes/OrderRoutes");
const authRoutes = require("./src/routes/AuthRoutes");
const customerOrderRoutes = require("./src/routes/CustomerOrderRoutes");
const driverOrderRoutes = require("./src/routes/DriverOrderRoutes");
const storeRoutes = require("./src/routes/StoreRoutes");
const usersRoutes = require("./src/routes/UsersRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const initialPort = parseInt(process.env.PORT, 10) || 5000;

app.use(cors());
app.use(express.json());

// Phục vụ tĩnh
app.use('/demo/static', express.static('public'));

const path = require('path');
app.get('/demo/customer', (req, res) => res.sendFile(path.join(__dirname, 'public/customer.html')));
app.get('/demo/store', (req, res) => res.sendFile(path.join(__dirname, 'public/store.html')));
app.get('/demo/driver', (req, res) => res.sendFile(path.join(__dirname, 'public/driver.html')));
app.get('/demo/manager', (req, res) => res.sendFile(path.join(__dirname, 'public/manager.html')));
app.get('/demo/*', (req, res) => res.sendFile(path.join(__dirname, 'public', req.params[0]))); // fallback for JS/CSS

// Swagger Documentation – served at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const messageRoutes = require("./src/routes/MessageRoutes");

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/driver", driverOrderRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/messages", messageRoutes);

// Centralized Error Handler (must be registered LAST, after all routes)
app.use(errorHandler);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`===========================================`);
    console.log(`🚀 Server is running on port ${server.address().port}`);
    console.log(`👤 Customer Portal: http://localhost:${server.address().port}/demo/customer`);
    console.log(`🏬 Store Portal:    http://localhost:${server.address().port}/demo/store`);
    console.log(`🚚 Driver Portal:   http://localhost:${server.address().port}/demo/driver`);
    console.log(`👑 Manager Portal:  http://localhost:${server.address().port}/demo/manager`);
    console.log(`📖 Swagger API Docs: http://localhost:${server.address().port}/api-docs`);
    console.log(`===========================================`);

    // Vấn đề 3: Auto-timeout finding_driver orders after 10 minutes
    setInterval(async () => {
      try {
        const { dbPromise } = require("./src/config/db");
        // Find orders stuck in finding_driver > 10 minutes
        const stuckOrders = await dbPromise.all(
          `SELECT id, customer_id, total_price, delivery_fee FROM Orders 
           WHERE status = 'finding_driver' 
           AND created_at < datetime('now', '-10 minutes')`
        );
        for (const order of stuckOrders) {
          await dbPromise.run(`UPDATE Orders SET status = 'cancelled' WHERE id = ? AND status = 'finding_driver'`, [order.id]);
          // Refund customer
          const refund = (order.total_price || 0) + (order.delivery_fee || 0);
          if (refund > 0 && order.customer_id) {
            await dbPromise.run(`UPDATE Users SET balance = balance + ? WHERE id = ?`, [refund, order.customer_id]);
          }
          console.log(`⏰ Auto-cancelled order #${order.id} (timeout 10min, refunded ${refund}đ)`);
        }
      } catch(e) {
        // Silently ignore timeout errors
      }
    }, 60000); // Check every 60 seconds
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
};

startServer(initialPort);
