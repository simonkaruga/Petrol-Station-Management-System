#!/bin/bash
echo "🔍 Testing Wakaruku System..."
echo ""

# Test 1: Check if backend is running
echo "1. Checking backend server..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running"
    echo "   Run: npm start"
    exit 1
fi

# Test 2: Check database connection
echo "2. Checking database..."
export PGPASSWORD=password
if psql -U postgres -h localhost -d wakaruku_petrol_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✅ Database connected"
else
    echo "   ❌ Database connection failed"
    exit 1
fi

# Test 3: Check if admin user exists
echo "3. Checking admin user..."
ADMIN_EXISTS=$(psql -U postgres -h localhost -d wakaruku_petrol_db -t -c "SELECT COUNT(*) FROM users WHERE username='admin';")
if [ "$ADMIN_EXISTS" -gt 0 ]; then
    echo "   ✅ Admin user exists"
    psql -U postgres -h localhost -d wakaruku_petrol_db -c "SELECT username, email, role FROM users WHERE username='admin';"
else
    echo "   ❌ Admin user NOT found"
    exit 1
fi

# Test 4: Try login
echo ""
echo "4. Testing login..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "token\|accessToken"; then
    echo "   ✅ Login successful!"
else
    echo "   ❌ Login failed"
    echo "   Check the response above for error details"
fi

echo ""
echo "All tests complete!"
