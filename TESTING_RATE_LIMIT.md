# How to Test Rate Limiting

## What is Rate Limiting?

Rate limiting protects your API from:
- **DDoS attacks** (too many requests overwhelming the server)
- **Brute force attacks** (trying many passwords quickly)
- **Abuse** (users spamming the system)

## Current Limits

- **Write operations** (POST/PUT/DELETE): **20 requests per minute**
- **Read operations** (GET): **100 requests per minute**

## How to Test

### Method 1: Browser Console (Easiest)

1. Open your website in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste this code and press Enter:

```javascript
// Test rate limiting by making 21 POST requests
async function testRateLimit() {
  const results = []
  
  for (let i = 1; i <= 21; i++) {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Test Product ${i}`,
          category: 'Electronics',
          condition: 'New',
        }),
      })
      
      const data = await response.json()
      results.push({
        request: i,
        status: response.status,
        allowed: response.status !== 429,
        message: data.error || 'Success'
      })
      
      console.log(`Request ${i}: Status ${response.status}`, data)
    } catch (error) {
      results.push({
        request: i,
        status: 'Error',
        allowed: false,
        message: error.message
      })
    }
  }
  
  console.table(results)
  return results
}

// Run the test
testRateLimit()
```

**Expected Result:**
- Requests 1-20: Should work (status 401 Unauthorized is OK - you're not logged in)
- Request 21: Should get **429 Too Many Requests** with error message

### Method 2: Using curl (Terminal)

```bash
# Make 21 POST requests quickly
for i in {1..21}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/products \
    -H "Content-Type: application/json" \
    -d '{"title":"Test","category":"Electronics","condition":"New"}' \
    -w "\nStatus: %{http_code}\n\n" \
    -s
  sleep 0.1  # Small delay between requests
done
```

**Expected Result:**
- First 20 requests: Status 401 (unauthorized) or 400 (validation error)
- 21st request: Status **429** (rate limited)

### Method 3: Using Postman/Thunder Client

1. Create a new POST request to `/api/products`
2. Use Postman's "Collection Runner" or "Run Collection" feature
3. Set iterations to 21
4. Run it
5. Check the responses - the 21st should be 429

### Method 4: Simple JavaScript Test Page

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Rate Limit Test</title>
</head>
<body>
  <button onclick="testRateLimit()">Test Rate Limiting (21 requests)</button>
  <div id="results"></div>

  <script>
    async function testRateLimit() {
      const resultsDiv = document.getElementById('results')
      resultsDiv.innerHTML = '<p>Testing... (this may take a moment)</p>'
      
      const results = []
      
      for (let i = 1; i <= 21; i++) {
        try {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Test ${i}`,
              category: 'Electronics',
              condition: 'New'
            })
          })
          
          const data = await response.json()
          results.push({
            request: i,
            status: response.status,
            message: response.status === 429 ? '⛔ RATE LIMITED' : '✅ Allowed'
          })
        } catch (error) {
          results.push({
            request: i,
            status: 'Error',
            message: error.message
          })
        }
      }
      
      // Display results
      let html = '<table border="1"><tr><th>Request #</th><th>Status</th><th>Result</th></tr>'
      results.forEach(r => {
        html += `<tr>
          <td>${r.request}</td>
          <td>${r.status}</td>
          <td>${r.message}</td>
        </tr>`
      })
      html += '</table>'
      resultsDiv.innerHTML = html
    }
  </script>
</body>
</html>
```

## What to Look For

### ✅ Success Indicators:

1. **First 20 requests:** 
   - Status codes: 200, 201, 400, or 401 (these are normal)
   - Response headers include:
     - `X-RateLimit-Limit: 20`
     - `X-RateLimit-Remaining: 19, 18, 17...` (decreasing)
     - `X-RateLimit-Reset: [timestamp]`

2. **21st request:**
   - Status code: **429 Too Many Requests**
   - Response body: `{ "error": "Too many requests. Please try again later." }`
   - Response header: `Retry-After: [seconds]`

### Example Response Headers (Request 1-20):
```
HTTP/1.1 401 Unauthorized
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1703123456
```

### Example Response (Request 21):
```json
{
  "error": "Too many requests. Please try again later."
}
```

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703123456
```

## Testing Different Endpoints

### Test Write Operations (20/min limit):
- `POST /api/products` - Create product
- `POST /api/products/status` - Update status
- `POST /api/products/delete` - Delete product
- `PUT /api/products/[id]` - Update product

### Test Read Operations (100/min limit):
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product
- `GET /api/my-listings` - Get user listings

## Understanding the Limits

- **Window:** 60 seconds (1 minute)
- **Write limit:** 20 requests per IP + endpoint
- **Read limit:** 100 requests per IP + endpoint
- **Reset:** After 60 seconds, the counter resets

## Important Notes

1. **Rate limiting is per IP address** - If you're testing locally, all requests come from `127.0.0.1`
2. **Rate limiting is per endpoint** - `/api/products` and `/api/products/delete` have separate counters
3. **The limit resets after 60 seconds** - Wait 1 minute and try again
4. **Authentication doesn't bypass rate limiting** - Even logged-in users are rate limited

## Troubleshooting

### If you're NOT getting 429:
1. Check that middleware is running: Look for rate limit headers in responses
2. Check the endpoint: Make sure you're hitting an API route (`/api/*`)
3. Check the method: POST/PUT/DELETE have stricter limits than GET
4. Wait 60 seconds: The window might have reset

### If you're getting 429 on first request:
1. You might have hit the limit in a previous test
2. Wait 60 seconds for the window to reset
3. Check if another process is making requests from the same IP

## Real-World Example

**Scenario:** A user tries to create 25 products in one minute

**What happens:**
- Requests 1-20: ✅ Allowed (products created)
- Requests 21-25: ⛔ Blocked with 429 error
- User must wait 60 seconds before creating more

This protects your server from:
- Accidental spam
- Malicious attacks
- Resource exhaustion

---

**Need help?** Check the browser console or network tab to see the actual responses and headers.

