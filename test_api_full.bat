@echo off
setlocal enabledelayedexpansion

echo === Getting JWT tokens ===

REM Login as customer
for /f "delims=" %%a in ('curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testcust1\",\"password\":\"password123\"}"') do set CUST_RESP=%%a

REM Login as driver
for /f "delims=" %%a in ('curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testdriver1\",\"password\":\"password123\"}"') do set DRIVER_RESP=%%a

echo Customer response: %CUST_RESP%
echo Driver response: %DRIVER_RESP%
echo.

REM Extract tokens using node
for /f "delims=" %%a in ('node -e "console.log(JSON.parse(process.argv[1]).data.token)" "%CUST_RESP%"') do set CUST_TOKEN=%%a
for /f "delims=" %%a in ('node -e "console.log(JSON.parse(process.argv[1]).data.token)" "%DRIVER_RESP%"') do set DRIVER_TOKEN=%%a

echo Customer token: %CUST_TOKEN%
echo Driver token: %DRIVER_TOKEN%
echo.

echo === TEST 9: Customer creates order ===
curl -s -X POST http://localhost:5000/api/customer/orders -H "Content-Type: application/json" -H "Authorization: Bearer %CUST_TOKEN%" -d "{\"pickupAddress\":\"123 Main St\",\"deliveryAddress\":\"456 Elm St\",\"itemDescription\":\"A small package\"}"
echo.
echo.

echo === TEST 10: Customer creates order - missing fields (Feature 2) ===
curl -s -X POST http://localhost:5000/api/customer/orders -H "Content-Type: application/json" -H "Authorization: Bearer %CUST_TOKEN%" -d "{\"pickupAddress\":\"123 Main St\"}"
echo.
echo.

echo === TEST 11: Customer gets own orders ===
curl -s http://localhost:5000/api/customer/orders -H "Authorization: Bearer %CUST_TOKEN%"
echo.
echo.

echo === TEST 12: Customer gets order by ID ===
curl -s http://localhost:5000/api/customer/orders/1 -H "Authorization: Bearer %CUST_TOKEN%"
echo.
echo.

echo === TEST 13: Driver gets pending orders ===
curl -s http://localhost:5000/api/driver/orders/pending -H "Authorization: Bearer %DRIVER_TOKEN%"
echo.
echo.

echo === TEST 14: Driver accepts order ===
curl -s -X PUT http://localhost:5000/api/driver/orders/1/accept -H "Authorization: Bearer %DRIVER_TOKEN%"
echo.
echo.

echo === TEST 15: Driver accepts same order again (Bug 1 - race condition) ===
curl -s -X PUT http://localhost:5000/api/driver/orders/1/accept -H "Authorization: Bearer %DRIVER_TOKEN%"
echo.
echo.

echo === TEST 16: Driver completes order ===
curl -s -X PUT http://localhost:5000/api/driver/orders/1/complete -H "Authorization: Bearer %DRIVER_TOKEN%"
echo.
echo.

echo === TEST 17: Driver completes already-completed order (Bug 4 - state machine) ===
curl -s -X PUT http://localhost:5000/api/driver/orders/1/complete -H "Authorization: Bearer %DRIVER_TOKEN%"
echo.
echo.

echo === TEST 18: Create another order to test cancel ===
curl -s -X POST http://localhost:5000/api/customer/orders -H "Content-Type: application/json" -H "Authorization: Bearer %CUST_TOKEN%" -d "{\"pickupAddress\":\"789 Oak Ave\",\"deliveryAddress\":\"321 Pine Rd\",\"itemDescription\":\"Large box\"}"
echo.
echo.

echo === TEST 19: Customer cancels pending order (Feature 1) ===
curl -s -X PUT http://localhost:5000/api/customer/orders/2/cancel -H "Authorization: Bearer %CUST_TOKEN%"
echo.
echo.

echo === TEST 20: Customer cancels already-cancelled order (Bug 4 - state machine) ===
curl -s -X PUT http://localhost:5000/api/customer/orders/2/cancel -H "Authorization: Bearer %CUST_TOKEN%"
echo.
echo.

echo === TEST 21: Access without token (401) ===
curl -s http://localhost:5000/api/customer/orders
echo.
echo.

echo === TEST 22: Customer tries driver endpoint (403) ===
curl -s http://localhost:5000/api/driver/orders/pending -H "Authorization: Bearer %CUST_TOKEN%"
echo.
echo.

echo === ALL TESTS COMPLETE ===
