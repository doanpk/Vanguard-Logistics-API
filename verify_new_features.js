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

async function verifyFeatures() {
  console.log("=== Verifying New Features ===");
  
  // 1. Get token
  console.log("Logging in...");
  let r = await request("POST", "/api/auth/login", { username: "apicust", password: "password123" });
  if (r.status !== 200) {
    // try registering first
    await request("POST", "/api/auth/register", { username: "apicust", password: "password123", role: "customer" });
    r = await request("POST", "/api/auth/login", { username: "apicust", password: "password123" });
  }
  const token = r.body.data.token;

  // 2. Test Cloud API Geocoding
  console.log("\nTesting Cloud API (Geocoding)...");
  r = await request("POST", "/api/customer/orders", { 
    pickupAddress: "Hanoi", 
    deliveryAddress: "Ho Chi Minh City", 
    itemDescription: "Test Cloud API" 
  }, token);
  
  if (r.status === 201) {
    console.log("  PASS: Order created.");
    if (r.body.data.lat && r.body.data.lng) {
      console.log(`  PASS: Geocoding successful! (Lat: ${r.body.data.lat}, Lng: ${r.body.data.lng})`);
    } else {
      console.log("  FAIL: Geocoding did not return coordinates (or Nominatim rate limit reached).");
    }
  } else {
    console.log("  FAIL: Could not create order. Response: ", r.body);
  }

  // 3. Inform about AI API
  console.log("\nTesting AI API (Smart Create)...");
  console.log("  NOTE: Please add your GEMINI_API_KEY to .env and use Postman/Swagger to test /api/customer/orders/smart-create");
  console.log("  Prompt example: 'Giao 1 ly trà sữa từ 123 Lê Lợi, Quận 1 đến 456 Nguyễn Huệ, Quận 1'");
}

verifyFeatures().catch(console.error);
