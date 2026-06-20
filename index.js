require("dotenv").config();
const express = require("express");
const cors = require("cors");
const orderRoutes = require("./src/routes/OrderRoutes");
const authRoutes = require("./src/routes/AuthRoutes");
const customerOrderRoutes = require("./src/routes/CustomerOrderRoutes");
const driverOrderRoutes = require("./src/routes/DriverOrderRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();
const initialPort = parseInt(process.env.PORT, 10) || 5000;

app.use(cors());
app.use(express.json());

// Swagger Documentation – served at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/driver", driverOrderRoutes);

// Centralized Error Handler (must be registered LAST, after all routes)
app.use(errorHandler);

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${server.address().port}`);
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
