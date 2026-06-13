const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Delivery Order Management API",
    version: "1.0.0",
    description:
      "API for managing delivery orders for customers and drivers. Includes role-based access control.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Dev Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Enter your JWT Bearer token in the format: Bearer <token>",
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password", "role"],
                properties: {
                  username: { type: "string", example: "customer1" },
                  password: { type: "string", example: "password123" },
                  role: {
                    type: "string",
                    example: "customer",
                    enum: ["customer", "driver"],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Bad request or username exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login and get a JWT token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "customer1" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/customer/orders": {
      post: {
        summary: "Create a new order",
        tags: ["Customer"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["pickupAddress", "deliveryAddress"],
                properties: {
                  pickupAddress: { type: "string", example: "123 Main St" },
                  deliveryAddress: { type: "string", example: "456 Elm St" },
                  itemDescription: {
                    type: "string",
                    example: "A small package",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Order created successfully" },
          400: { description: "Missing required fields" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Requires customer role" },
        },
      },
      get: {
        summary: "Get all orders for the logged-in customer",
        tags: ["Customer"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Orders retrieved successfully" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Requires customer role" },
        },
      },
    },
    "/api/customer/orders/{id}": {
      get: {
        summary: "Get details of a specific order",
        tags: ["Customer"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "The Order ID",
          },
        ],
        responses: {
          200: { description: "Order details retrieved" },
          404: { description: "Order not found" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Requires customer role" },
        },
      },
    },
    "/api/driver/orders/pending": {
      get: {
        summary: "Get all pending orders available for drivers",
        tags: ["Driver"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Pending orders retrieved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Requires driver role" },
        },
      },
    },
    "/api/driver/orders/{id}/accept": {
      put: {
        summary: "Accept an available pending order",
        tags: ["Driver"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "The Order ID",
          },
        ],
        responses: {
          200: { description: "Order accepted successfully" },
          404: { description: "Order not found or unavailable" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Requires driver role" },
        },
      },
    },
    "/api/driver/orders/{id}/complete": {
      put: {
        summary: "Mark an accepted order as completed",
        tags: ["Driver"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "The Order ID",
          },
        ],
        responses: {
          200: { description: "Order completed successfully" },
          404: { description: "Order not found or not assigned to you" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Requires driver role" },
        },
      },
    },
    "/api/driver/my-orders": {
      get: {
        summary: "Get all orders assigned to the logged-in driver",
        tags: ["Driver"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Driver orders retrieved" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Requires driver role" },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
