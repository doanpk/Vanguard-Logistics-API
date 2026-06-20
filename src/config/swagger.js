const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Delivery Order Management API",
      version: "1.0.0",
      description:
        "A comprehensive RESTful API for managing delivery orders. Supports customer order creation, driver order acceptance & completion, and role-based access control via JWT authentication.",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "JWT Authorization header. Obtain a token from the /api/auth/login endpoint and enter it here.",
        },
      },
      schemas: {
        // ── Unified API Response Envelope ──
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            data: { type: "object", nullable: true, example: null },
          },
        },

        // ── Auth Schemas ──
        RegisterRequest: {
          type: "object",
          required: ["username", "password", "role"],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              example: "customer1",
              description: "Username must be at least 3 characters",
            },
            password: {
              type: "string",
              minLength: 6,
              example: "password123",
              description: "Password must be at least 6 characters",
            },
            role: {
              type: "string",
              enum: ["customer", "driver"],
              example: "customer",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: { type: "string", example: "customer1" },
            password: { type: "string", example: "password123" },
          },
        },
        AuthUser: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            username: { type: "string", example: "customer1" },
            role: { type: "string", example: "customer" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/AuthUser" },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },

        // ── Order Schemas ──
        Order: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            customer_id: { type: "integer", example: 1 },
            driver_id: { type: "integer", nullable: true, example: null },
            pickup_address: { type: "string", example: "123 Main St" },
            delivery_address: { type: "string", example: "456 Elm St" },
            item_description: {
              type: "string",
              nullable: true,
              example: "A small package",
            },
            status: {
              type: "string",
              enum: ["pending", "accepted", "completed", "cancelled"],
              example: "pending",
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-06-20T10:00:00.000Z",
            },
          },
        },
        CreateOrderRequest: {
          type: "object",
          required: ["pickupAddress", "deliveryAddress", "itemDescription"],
          properties: {
            pickupAddress: { type: "string", example: "123 Main St" },
            deliveryAddress: { type: "string", example: "456 Elm St" },
            itemDescription: { type: "string", example: "A small package" },
          },
        },
        AdminCreateOrderRequest: {
          type: "object",
          required: ["customerName", "deliveryAddress"],
          properties: {
            customerName: { type: "string", example: "John Doe" },
            deliveryAddress: { type: "string", example: "456 Elm St" },
            pickupAddress: { type: "string", example: "123 Main St" },
            itemDescription: { type: "string", example: "A small package" },
          },
        },
        UpdateOrderStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["pending", "accepted", "completed", "cancelled"],
              example: "accepted",
            },
          },
        },
      },
    },
  },
  // Scan all route files for @openapi / @swagger JSDoc comments
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
