@echo off
echo === TEST 1: Register customer ===
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"testcust1\",\"password\":\"password123\",\"role\":\"customer\"}"
echo.
echo.

echo === TEST 2: Register driver ===
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"testdriver1\",\"password\":\"password123\",\"role\":\"driver\"}"
echo.
echo.

echo === TEST 3: Register with invalid role (Bug 5) ===
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"admin1\",\"password\":\"password123\",\"role\":\"admin\"}"
echo.
echo.

echo === TEST 4: Register with short password (Feature 2) ===
curl -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"short\",\"password\":\"123\",\"role\":\"customer\"}"
echo.
echo.

echo === TEST 5: Login customer ===
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testcust1\",\"password\":\"password123\"}"
echo.
echo.

echo === TEST 6: Login with empty fields (Feature 2) ===
curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"\",\"password\":\"\"}"
echo.
echo.

echo === TEST 7: Get all orders (admin) ===
curl -s http://localhost:5000/api/orders
echo.
echo.

echo === TEST 8: Swagger docs ===
curl -s http://localhost:5000/api-docs/ -o NUL -w "HTTP Status: %%{http_code}"
echo.
