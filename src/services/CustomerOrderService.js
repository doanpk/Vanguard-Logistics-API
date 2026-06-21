const OrderModel = require("../models/OrderModel");
const { canTransition } = require("../utils/orderStateMachine");
const logger = require("../utils/logger");

class CustomerOrderService {
  // Cloud API Integration: Get coordinates from delivery address
  static async geocodeAddress(address) {
    // Nếu address có dạng "lat, lng" thì parse luôn, bỏ qua API
    const coordsMatch = address.match(/^([\d\.-]+),\s*([\d\.-]+)$/);
    if (coordsMatch) {
      return {
        lat: parseFloat(coordsMatch[1]),
        lng: parseFloat(coordsMatch[2])
      };
    }

    try {
      // Using OpenStreetMap Nominatim API (Free, no auth required)
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;
      
      const response = await fetch(url, {
        headers: { "User-Agent": "DeliveryApp-BTL/1.0" } // Nominatim requires User-Agent
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      logger.error(`Geocoding failed: ${error.message}`);
      // Fallback if Cloud API fails, we just return nulls
    }
    return { lat: null, lng: null };
  }

  static async createOrder(customerId, data) {
    const { storeId, items, deliveryAddress } = data;
    if (!storeId || !deliveryAddress || !items || items.length === 0) {
      const err = new Error("Store ID, items, and delivery address are required.");
      err.status = 400;
      throw err;
    }
    
    // Fetch store to get pickup address
    const StoreModel = require("../models/StoreModel");
    const store = await StoreModel.findStoreById(storeId);
    if (!store) {
      const err = new Error("Store not found.");
      err.status = 404;
      throw err;
    }
    
    const pickupAddress = store.address || "Store Address Not Set";
    
    // Calculate total price and generate item description
    let totalPrice = 0;
    let descParts = [];
    for (let item of items) {
      const qty = item.qty || 1;
      const price = item.price || 0;
      totalPrice += qty * price;
      descParts.push(`${qty}x ${item.name}`);
    }
    const itemDescription = descParts.join(", ");
    
    // Call Cloud API to get coordinates
    const { lat, lng } = await this.geocodeAddress(deliveryAddress);

    // Dynamic Pricing Logic
    const { calculateDeliveryFee } = require("../utils/distance");
    const deliveryFee = calculateDeliveryFee(store.lat, store.lng, lat, lng);

    // WALLET LOGIC: Check balance
    const UserModel = require("../models/UserModel");
    const customer = await UserModel.findById(customerId);
    const totalCost = totalPrice + deliveryFee;

    if (customer.balance < totalCost) {
      const err = new Error(`Insufficient balance. You need ${totalCost} VND but only have ${customer.balance} VND. Please deposit money.`);
      err.status = 402; // Payment required
      throw err;
    }

    // Deduct from customer
    await UserModel.updateBalance(customerId, -totalCost);

    // Update customer's default address and coordinates
    try {
      await UserModel.updateField(customerId, 'address', deliveryAddress);
      if (lat !== null && lng !== null) {
        await UserModel.updateField(customerId, 'lat', lat);
        await UserModel.updateField(customerId, 'lng', lng);
      }
    } catch (e) {
      logger.error(`Failed to update customer default address: ${e.message}`);
    }

    return await OrderModel.create(
      customerId,
      storeId,
      pickupAddress,
      deliveryAddress,
      itemDescription,
      totalPrice,
      deliveryFee,
      lat,
      lng
    );
  }

  // AI API Integration: Smart Create Order using Google Gemini
  static async smartCreateOrder(customerId, prompt) {
    if (!prompt) {
      const err = new Error("Prompt is required for smart order creation.");
      err.status = 400;
      throw err;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const err = new Error("Gemini API key is not configured.");
      err.status = 500;
      throw err;
    }

    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const systemPrompt = `You are an AI assistant for a delivery app. Extract the following information from the user's request:
      - pickupAddress: where to pick up the item.
      - deliveryAddress: where to deliver the item.
      - itemDescription: what item is being delivered.
      Respond ONLY in raw JSON format with these 3 keys. No markdown, no backticks, no other text.`;

      const result = await model.generateContent([systemPrompt, prompt]);
      const responseText = result.response.text();
      
      // Clean up response text (remove markdown if any)
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extractedData = JSON.parse(cleanJson);

      return await this.createOrder(customerId, extractedData);
    } catch (error) {
      logger.error("AI Smart Create Failed: " + error.message);
      const err = new Error("Failed to process request with AI. " + error.message);
      err.status = 500;
      throw err;
    }
  }

  static async getCustomerOrders(customerId) {
    return await OrderModel.findByCustomerId(customerId);
  }

  // Bug 3 Fix: Already queries with customer_id via findByIdAndCustomerId
  static async getOrderDetails(id, customerId) {
    const order = await OrderModel.findByIdAndCustomerId(id, customerId);
    if (!order) {
      const err = new Error("Order not found or access denied.");
      err.status = 404;
      throw err;
    }
    return order;
  }

  // Feature 1: Cancel order — expanded to support finding_driver and preparing (with penalty)
  static async cancelOrder(orderId, customerId) {
    const order = await OrderModel.findByIdAndCustomerId(orderId, customerId);
    if (!order) {
      const err = new Error("Order not found or access denied.");
      err.status = 404;
      throw err;
    }

    // Bug 4 Fix: Validate state transition using state machine
    if (!canTransition(order.status, "cancelled")) {
      const err = new Error(
        `Cannot cancel order. Current status '${order.status}' cannot transition to 'cancelled'.`
      );
      err.status = 400;
      throw err;
    }

    // Cancel the order in DB
    const cancelledOrder = await OrderModel.cancelOrderExpanded(orderId, customerId, order.status);
    if (!cancelledOrder) {
      const err = new Error("Failed to cancel order. It may have been updated by another process.");
      err.status = 409;
      throw err;
    }

    // WALLET LOGIC: Refund based on status
    const totalCost = (order.total_price || 0) + (order.delivery_fee || 0);
    if (totalCost > 0) {
      const UserModel = require("../models/UserModel");
      if (order.status === 'pending' || order.status === 'finding_driver') {
        // Full refund
        await UserModel.updateBalance(customerId, totalCost);
      } else if (order.status === 'preparing') {
        // 80% refund (20% penalty for quán đã nấu)
        const penalty = Math.round(totalCost * 0.2);
        const refund = totalCost - penalty;
        await UserModel.updateBalance(customerId, refund);
        // Cộng penalty cho quán
        if (order.store_id) {
          await UserModel.updateBalance(order.store_id, penalty);
        }
      }
    }

    return cancelledOrder;
  }
}

module.exports = CustomerOrderService;
