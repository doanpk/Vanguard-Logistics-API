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
      let encodedAddress = encodeURIComponent(address);
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;
      
      let response = await fetch(url, {
        headers: { "User-Agent": "DeliveryApp-BTL/1.0" } // Nominatim requires User-Agent
      });
      let data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }

      // AI-Assisted Fallback
      if (!data || data.length === 0) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          logger.info(`Nominatim failed for '${address}'. Activating AI Fallback...`);
          const { GoogleGenerativeAI } = require("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          
          const systemPrompt = `You are a strict address normalizer for Vietnam. The user will provide a messy address. Your job is to extract and format it into a clean, official administrative address (House number, Street, Ward, District, City) that a map API like OpenStreetMap can easily find. Do not invent details. Ignore slang, nearby landmarks ("gần quán", "cạnh chùa"), or instructions. Return ONLY the clean address string. If you cannot extract a valid address, return the string "UNKNOWN".`;
          
          const result = await model.generateContent([systemPrompt, address]);
          const cleanAddress = result.response.text().trim();
          
          if (cleanAddress !== "UNKNOWN" && cleanAddress.length > 5) {
            logger.info(`AI normalized address to: '${cleanAddress}'`);
            encodedAddress = encodeURIComponent(cleanAddress);
            url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;
            response = await fetch(url, { headers: { "User-Agent": "DeliveryApp-BTL/1.0" } });
            data = await response.json();
            
            if (data && data.length > 0) {
              logger.info(`AI Fallback successful for '${cleanAddress}'`);
              return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Geocoding failed: ${error.message}`);
      // Fallback if Cloud API fails, we just return nulls
    }
    return { lat: null, lng: null };
  }

  static async createOrder(customerId, data) {
    const { storeId, items, deliveryAddress, note } = data;
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
    // Fix: Không tin tưởng giá trị price từ Client, lấy giá gốc từ Database
    const menuItems = await StoreModel.getMenuItems(storeId);
    let totalPrice = 0;
    let descParts = [];
    for (let item of items) {
      const qty = item.qty || 1;
      
      // Khớp món ăn dựa trên id hoặc name
      const dbItem = menuItems.find(m => m.id === item.id || m.name === item.name);
      if (!dbItem) {
        const err = new Error(`Món ăn '${item.name}' không tồn tại trong menu của quán.`);
        err.status = 400;
        throw err;
      }

      const actualPrice = dbItem.price;
      totalPrice += qty * actualPrice;
      descParts.push(`${qty}x ${dbItem.name}`);
    }
    const itemDescription = descParts.join(", ");
    
    // Call Cloud API to get coordinates
    const { lat, lng } = await this.geocodeAddress(deliveryAddress);

    if (lat === null || lng === null) {
      const err = new Error("Hệ thống không thể định vị được địa chỉ này trên bản đồ. Vui lòng bấm nút lấy vị trí GPS hoặc ghi rõ (Tên đường, Phường, Quận, Thành Phố).");
      err.status = 400;
      throw err;
    }

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
      lng,
      note
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
        // Fix Lỗi 2: Chia lại đền bù - Khách nhận 70%, Quán 20%, Driver 10%
        // (Vì tài xế đã được gán và có thể đang chạy tới quán)
        const storePenalty = Math.round(totalCost * 0.2);
        const driverPenalty = Math.round(totalCost * 0.1);
        const refund = totalCost - storePenalty - driverPenalty;
        
        await UserModel.updateBalance(customerId, refund);
        
        // Cộng tiền đền bù cho quán (đã chuẩn bị nguyên liệu)
        if (order.store_id) {
          await UserModel.updateBalance(order.store_id, storePenalty);
        }
        
        // Cộng tiền đền bù xăng xe cho tài xế
        if (order.driver_id) {
          await UserModel.updateBalance(order.driver_id, driverPenalty);
        }
      }
    }

    return cancelledOrder;
  }
}

module.exports = CustomerOrderService;
