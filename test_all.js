const http = require("http");

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) options.headers["Authorization"] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(testName, condition, detail) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
  } else {
    console.log(`  FAIL: ${testName} — ${detail}`);
  }
}

async function runTests() {
  let custToken, driverToken;

  // ==================== AUTH TESTS ====================
  console.log("\n=== AUTHENTICATION TESTS ===");

  // Test 1: Register customer
  let r = await request("POST", "/api/auth/register", { username: "apicust", password: "password123", role: "customer" });
  assert("Register customer", r.status === 201 && r.body.success === true, JSON.stringify(r.body));

  // Test 2: Register driver
  r = await request("POST", "/api/auth/register", { username: "apidriver", password: "password123", role: "driver" });
  assert("Register driver", r.status === 201 && r.body.success === true, JSON.stringify(r.body));

  // Test 3: Register 2nd driver (for Bug 2 test)
  r = await request("POST", "/api/auth/register", { username: "apidriver2", password: "password123", role: "driver" });
  assert("Register driver2", r.status === 201 && r.body.success === true, JSON.stringify(r.body));

  // Test 4 (Bug 5): Register with invalid role
  r = await request("POST", "/api/auth/register", { username: "admin1", password: "password123", role: "admin" });
  assert("Bug 5: Reject invalid role 'admin'", r.status === 400 && r.body.success === false, JSON.stringify(r.body));

  // Test 5 (Feature 2): Register with short username/password
  r = await request("POST", "/api/auth/register", { username: "ab", password: "123", role: "customer" });
  assert("Feature 2: Reject short username+password", r.status === 400 && r.body.message.includes("Username") && r.body.message.includes("Password"), JSON.stringify(r.body));

  // Test 6: Login customer
  r = await request("POST", "/api/auth/login", { username: "apicust", password: "password123" });
  assert("Login customer", r.status === 200 && r.body.data.token, JSON.stringify(r.body));
  custToken = r.body.data.token;

  // Test 7: Login driver
  r = await request("POST", "/api/auth/login", { username: "apidriver", password: "password123" });
  assert("Login driver", r.status === 200 && r.body.data.token, JSON.stringify(r.body));
  driverToken = r.body.data.token;

  // Get driver2 token
  r = await request("POST", "/api/auth/login", { username: "apidriver2", password: "password123" });
  const driver2Token = r.body.data.token;

  // Test 8 (Feature 2): Login with empty fields
  r = await request("POST", "/api/auth/login", { username: "", password: "" });
  assert("Feature 2: Reject empty login fields", r.status === 400 && r.body.success === false, JSON.stringify(r.body));

  // ==================== CUSTOMER ORDER TESTS ====================
  console.log("\n=== CUSTOMER ORDER TESTS ===");

  // Test 9: Create order
  r = await request("POST", "/api/customer/orders", { pickupAddress: "123 Main St", deliveryAddress: "456 Elm St", itemDescription: "A small package" }, custToken);
  assert("Create order", r.status === 201 && r.body.data.status === "pending", JSON.stringify(r.body));
  const orderId1 = r.body.data.id;

  // Test 10 (Feature 2): Create order with missing fields
  r = await request("POST", "/api/customer/orders", { pickupAddress: "123 Main St" }, custToken);
  assert("Feature 2: Reject missing fields", r.status === 400 && r.body.message.includes("Delivery address") && r.body.message.includes("Item description"), JSON.stringify(r.body));

  // Test 11: Get own orders
  r = await request("GET", "/api/customer/orders", null, custToken);
  assert("Get own orders", r.status === 200 && Array.isArray(r.body.data), JSON.stringify(r.body));

  // Test 12 (Bug 3): Get order by ID (with customer_id check)
  r = await request("GET", `/api/customer/orders/${orderId1}`, null, custToken);
  assert("Bug 3: Get own order by ID", r.status === 200 && r.body.data.id === orderId1, JSON.stringify(r.body));

  // ==================== DRIVER TESTS ====================
  console.log("\n=== DRIVER TESTS ===");

  // Test 13: Driver gets pending orders
  r = await request("GET", "/api/driver/orders/pending", null, driverToken);
  assert("Driver gets pending orders", r.status === 200 && r.body.data.length > 0, JSON.stringify(r.body));

  // Test 14 (Bug 1): Driver accepts order
  r = await request("PUT", `/api/driver/orders/${orderId1}/accept`, null, driverToken);
  assert("Bug 1: Driver accepts order", r.status === 200 && r.body.data.status === "accepted", JSON.stringify(r.body));

  // Test 15 (Bug 1): Second driver tries to accept same order (race condition)
  r = await request("PUT", `/api/driver/orders/${orderId1}/accept`, null, driver2Token);
  assert("Bug 1: Race condition — 2nd driver rejected", r.status === 400 || r.status === 409, `status=${r.status} ${JSON.stringify(r.body)}`);

  // Test 16 (Bug 4): Try to accept an already accepted order (state machine)
  r = await request("PUT", `/api/driver/orders/${orderId1}/accept`, null, driverToken);
  assert("Bug 4: Cannot re-accept accepted order", r.status === 400, `status=${r.status} ${JSON.stringify(r.body)}`);

  // Test 17 (Bug 2): Driver2 tries to complete driver1's order
  r = await request("PUT", `/api/driver/orders/${orderId1}/complete`, null, driver2Token);
  assert("Bug 2: Driver2 cannot complete driver1's order", r.status === 403, `status=${r.status} ${JSON.stringify(r.body)}`);

  // Test 18: Driver completes own order
  r = await request("PUT", `/api/driver/orders/${orderId1}/complete`, null, driverToken);
  assert("Driver completes own order", r.status === 200 && r.body.data.status === "completed", JSON.stringify(r.body));

  // Test 19 (Bug 4): Try to complete an already completed order
  r = await request("PUT", `/api/driver/orders/${orderId1}/complete`, null, driverToken);
  assert("Bug 4: Cannot re-complete order", r.status === 400, `status=${r.status} ${JSON.stringify(r.body)}`);

  // Test 20: Driver get my orders
  r = await request("GET", "/api/driver/my-orders", null, driverToken);
  assert("Driver gets assigned orders", r.status === 200 && r.body.data.length > 0, JSON.stringify(r.body));

  // ==================== CANCEL ORDER TESTS ====================
  console.log("\n=== CANCEL ORDER TESTS (Feature 1) ===");

  // Create a new order to cancel
  r = await request("POST", "/api/customer/orders", { pickupAddress: "789 Oak Ave", deliveryAddress: "321 Pine Rd", itemDescription: "Large box" }, custToken);
  const orderId2 = r.body.data.id;

  // Test 21: Cancel pending order
  r = await request("PUT", `/api/customer/orders/${orderId2}/cancel`, null, custToken);
  assert("Feature 1: Cancel pending order", r.status === 200 && r.body.data.status === "cancelled", JSON.stringify(r.body));

  // Test 22 (Bug 4): Cancel already-cancelled order
  r = await request("PUT", `/api/customer/orders/${orderId2}/cancel`, null, custToken);
  assert("Bug 4: Cannot cancel already-cancelled order", r.status === 400, `status=${r.status} ${JSON.stringify(r.body)}`);

  // Test 23: Try to cancel completed order (state machine)
  r = await request("PUT", `/api/customer/orders/${orderId1}/cancel`, null, custToken);
  assert("Bug 4: Cannot cancel completed order", r.status === 400, `status=${r.status} ${JSON.stringify(r.body)}`);

  // ==================== AUTHORIZATION TESTS ====================
  console.log("\n=== AUTHORIZATION TESTS ===");

  // Test 24: Access without token
  r = await request("GET", "/api/customer/orders", null, null);
  assert("401 without token", r.status === 401, `status=${r.status}`);

  // Test 25: Customer tries driver endpoint
  r = await request("GET", "/api/driver/orders/pending", null, custToken);
  assert("403 customer on driver endpoint", r.status === 403, `status=${r.status}`);

  // Test 26: Driver tries customer endpoint
  r = await request("GET", "/api/customer/orders", null, driverToken);
  assert("403 driver on customer endpoint", r.status === 403, `status=${r.status}`);

  // ==================== RESPONSE FORMAT TESTS ====================
  console.log("\n=== RESPONSE FORMAT TESTS (Feature 3) ===");

  r = await request("GET", "/api/orders", null, null);
  assert("Response has 'success' field", typeof r.body.success === "boolean", JSON.stringify(r.body));
  assert("Response has 'message' field", typeof r.body.message === "string", JSON.stringify(r.body));
  assert("Response has 'data' field", "data" in r.body, JSON.stringify(r.body));

  console.log("\n=== ALL TESTS COMPLETE ===\n");
}

runTests().catch(console.error);
