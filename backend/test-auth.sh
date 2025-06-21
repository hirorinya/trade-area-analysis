#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Trade Area Analysis Authentication API${NC}\n"

BASE_URL="http://localhost:8000/api"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 2: Register New User
echo -e "${YELLOW}2. Testing User Registration...${NC}"
register_data='{
    "email": "test@example.com",
    "password": "testpassword123",
    "first_name": "Test",
    "last_name": "User",
    "company": "Test Company"
}'

response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$register_data" \
    "$BASE_URL/auth/register")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ Registration successful${NC}"
    # Extract access token for further tests
    access_token=$(echo "$body" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "Access token: ${access_token:0:20}..."
else
    echo -e "${RED}❌ Registration failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 3: Login with Same User
echo -e "${YELLOW}3. Testing User Login...${NC}"
login_data='{
    "email": "test@example.com",
    "password": "testpassword123"
}'

response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$login_data" \
    "$BASE_URL/auth/login")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    # Extract access token
    access_token=$(echo "$body" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "New access token: ${access_token:0:20}..."
else
    echo -e "${RED}❌ Login failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 4: Get Profile (Protected Route)
if [ ! -z "$access_token" ]; then
    echo -e "${YELLOW}4. Testing Protected Route (Get Profile)...${NC}"
    response=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $access_token" \
        "$BASE_URL/auth/profile")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Profile retrieval successful${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}❌ Profile retrieval failed (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
else
    echo -e "${RED}❌ Skipping profile test - no access token${NC}"
fi
echo ""

# Test 5: Invalid Login
echo -e "${YELLOW}5. Testing Invalid Login...${NC}"
invalid_login_data='{
    "email": "test@example.com",
    "password": "wrongpassword"
}'

response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$invalid_login_data" \
    "$BASE_URL/auth/login")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✅ Invalid login properly rejected${NC}"
else
    echo -e "${RED}❌ Invalid login test failed (expected 401, got $http_code)${NC}"
    echo "Response: $body"
fi
echo ""

echo -e "${YELLOW}🏁 Authentication API testing complete!${NC}"