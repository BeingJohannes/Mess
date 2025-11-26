#!/bin/bash

# MESS Server Deployment Check Script
# This script helps diagnose Edge Function deployment issues

echo "🔧 MESS Server Deployment Checker"
echo "=================================="
echo ""

PROJECT_ID="qlhdhtgpwwbjkksrnehk"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1/server"

echo "Testing Edge Function deployment..."
echo "Project ID: $PROJECT_ID"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Root endpoint
echo "📍 Test 1: Root Endpoint"
echo "URL: $BASE_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS - Server is responding!"
    echo "Response:"
    curl -s "$BASE_URL" | jq . 2>/dev/null || curl -s "$BASE_URL"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ FAILED - Cannot connect to server"
    echo ""
    echo "🚨 THE EDGE FUNCTION IS NOT DEPLOYED!"
    echo ""
    echo "To fix this, run these commands:"
    echo "  1. supabase login"
    echo "  2. supabase link --project-ref $PROJECT_ID"
    echo "  3. supabase functions deploy server"
    echo ""
    exit 1
else
    echo "⚠️  WARNING - Server returned HTTP $HTTP_CODE"
    echo "Response:"
    curl -s "$BASE_URL"
fi

echo ""
echo "---"
echo ""

# Test 2: Health endpoint (no prefix)
echo "📍 Test 2: Health Endpoint (no prefix)"
echo "URL: $BASE_URL/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS"
    curl -s "$BASE_URL/health" | jq . 2>/dev/null || curl -s "$BASE_URL/health"
else
    echo "⚠️  HTTP $HTTP_CODE"
fi

echo ""
echo "---"
echo ""

# Test 3: Health endpoint (with prefix)
echo "📍 Test 3: Health Endpoint (with prefix - used by app)"
echo "URL: $BASE_URL/make-server-6ff8009f/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/make-server-6ff8009f/health")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS"
    curl -s "$BASE_URL/make-server-6ff8009f/health" | jq . 2>/dev/null || curl -s "$BASE_URL/make-server-6ff8009f/health"
else
    echo "⚠️  HTTP $HTTP_CODE"
fi

echo ""
echo "=================================="
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "🎉 All tests passed! Your server is deployed and working."
    echo ""
    echo "Next steps:"
    echo "  1. Open your Mess app"
    echo "  2. Click 'New Game'"
    echo "  3. Start playing!"
else
    echo "⚠️  Some tests failed. Please deploy the Edge Function:"
    echo ""
    echo "Commands to run:"
    echo "  supabase login"
    echo "  supabase link --project-ref $PROJECT_ID"
    echo "  supabase functions deploy server"
    echo ""
    echo "After deploying, run this script again to verify."
fi

echo ""
