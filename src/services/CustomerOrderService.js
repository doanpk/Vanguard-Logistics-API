const OrderModel = require("../models/OrderModel");
const { canTransition } = require("../utils/orderStateMachine");
const logger = require("../utils/logger");

class CustomerOrderService {
  // Cloud API Integration: Get coordinates from delivery address
  static async geocodeAddress(address) {
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
    const { pickupAddress, deliveryAddress, itemDescription } = data;
    if (!pickupAddress || !deliveryAddress) {
      const err = new Error("Pickup address and delivery address are required.");
      err.status = 400;
      throw err;
    }
    
    // Call Cloud API to get coordinates
    const { lat, lng } = await this.geocodeAddress(deliveryAddress);

    return await OrderModel.create(
      customerId,
      pickupAddress,
      deliveryAddress,
      itemDescription,
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

  // Feature 1: Cancel order — only the owning customer can cancel, only when pending
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

    const cancelledOrder = await OrderModel.cancelOrder(orderId, customerId);
    if (!cancelledOrder) {
      const err = new Error("Failed to cancel order. It may have been updated by another process.");
      err.status = 409;
      throw err;
    }
    return cancelledOrder;
  }
}

module.exports = CustomerOrderService;
