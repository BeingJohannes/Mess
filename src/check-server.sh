#!/bin/bash

# MESS Server Deployment Check Script
# This script helps diagnose Edge Function deployment issues

echo "🔧 MESS Server Deployment Checker"
echo "=================================="
echo ""

PROJECT_ID="qlhdhtgpwwbjkksrnehk"
# Active function slug (the deployed function that serves routes)
FUNCTION_SLUG="server"
BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_SLUG}"

# Optionally set PUBLIC_ANON_KEY in environment to allow authorized checks
PUBLIC_ANON_KEY="${PUBLIC_ANON_KEY:-}"

echo "Testing Edge Function deployment..."
echo "Project ID: $PROJECT_ID"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Root endpoint
echo "📍 Test 1: Root Endpoint"
echo "URL: https://${PROJECT_ID}.supabase.co/functions/v1/server (note: preferred slug: $FUNCTION_SLUG)"
echo "Probing canonical slug path: $BASE_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS - Server is responding!"
    echo "Response:"
    if [ -n "$PUBLIC_ANON_KEY" ]; then
        curl -s -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL" | jq . 2>/dev/null || curl -s -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL"
    else
        curl -s "$BASE_URL" | jq . 2>/dev/null || curl -s "$BASE_URL"
    fi
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
if [ -n "$PUBLIC_ANON_KEY" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL/health")
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
fi

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS"
    if [ -n "$PUBLIC_ANON_KEY" ]; then
        curl -s -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL/health" | jq . 2>/dev/null || curl -s -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL/health"
    else
        curl -s "$BASE_URL/health" | jq . 2>/dev/null || curl -s "$BASE_URL/health"
    fi
else
    echo "⚠️  HTTP $HTTP_CODE"
fi

echo ""
echo "---"
echo ""

# Test 3: Health endpoint (with prefix)
echo "📍 Test 3: Health Endpoint (with prefix - used by app)"
echo "URL: $BASE_URL/health"
if [ -n "$PUBLIC_ANON_KEY" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL/health")
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
fi

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS"
    if [ -n "$PUBLIC_ANON_KEY" ]; then
        curl -s -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL/health" | jq . 2>/dev/null || curl -s -H "Authorization: Bearer $PUBLIC_ANON_KEY" "$BASE_URL/health"
    else
        curl -s "$BASE_URL/health" | jq . 2>/dev/null || curl -s "$BASE_URL/health"
    fi
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
