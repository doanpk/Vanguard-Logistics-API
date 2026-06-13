require("dotenv").config();
const express = require("express");
const cors = require("cors");
const orderRoutes = require("./src/routes/OrderRoutes");
const authRoutes = require("./src/routes/AuthRoutes");
const customerOrderRoutes = require("./src/routes/CustomerOrderRoutes");
const driverOrderRoutes = require("./src/routes/DriverOrderRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./src/config/swagger");

const app = express();
const initialPort = parseInt(process.env.PORT, 10) || 5000;

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/driver", driverOrderRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ status: "error", message: "Internal Server Error", data: null });
});

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
