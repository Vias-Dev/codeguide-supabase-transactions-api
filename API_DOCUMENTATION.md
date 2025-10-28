# Transaction System API Documentation

This document provides comprehensive documentation for the transaction system API endpoints, authentication, error handling, and usage examples.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Response Format](#response-format)
6. [Code Examples](#code-examples)

## Authentication

All transaction system endpoints require API key authentication using the `x-api-key` header.

### Request Headers

```
x-api-key: your_api_key_here
```

### Getting API Keys

API keys can be created through the user management system or by contacting an administrator.

### Authentication Process

1. The middleware validates the API key against the database
2. It checks if the associated user account is active and not banned
3. If valid, the user ID is attached to the request context
4. If invalid, a 401 Unauthorized response is returned

## API Endpoints

### Balance Management

#### GET /api/balance

Retrieves the authenticated user's current balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000.50
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

#### POST /api/balance

Initialize or update user balance (for testing/admin purposes).

**Request Body:**
```json
{
  "amount": 1000.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000.00
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

### Payment Processing

#### POST /api/pay

Process a payment from the authenticated user to another user.

**Request Body:**
```json
{
  "recipientId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 100.00,
  "orderid": "ORDER_12345",
  "bayarvia": "transfer",
  "namaproduk": "Product Name",
  "catatan": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "456e7890-e89b-12d3-a456-426614174001",
    "orderid": "ORDER_12345",
    "amount": 100.00,
    "senderNewBalance": 900.00,
    "receiverNewBalance": 1100.00
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

### Transaction History

#### GET /api/trx

Retrieve transaction history for the authenticated user.

**Query Parameters:**
- `limit`: Number of records to return (default: 50, max: 100)
- `offset`: Number of records to skip (default: 0)

**Example:** `GET /api/trx?limit=10&offset=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "sender_id": "123e4567-e89b-12d3-a456-426614174000",
        "receiver_id": "789e0123-e89b-12d3-a456-426614174002",
        "amount": 100.00,
        "paid": true,
        "orderid": "ORDER_12345",
        "bayarvia": "transfer",
        "grandtotal": 100.00,
        "namaproduk": "Product Name",
        "catatan": "Optional notes",
        "created_at": "2025-01-28T12:00:00.000Z",
        "updated_at": "2025-01-28T12:00:00.000Z",
        "direction": "sent"
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 20,
      "total": 150,
      "hasMore": true
    }
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

### Mutation History

#### GET /api/mut

Retrieve balance mutation history for the authenticated user.

**Query Parameters:**
- `limit`: Number of records to return (default: 50, max: 100)
- `offset`: Number of records to skip (default: 0)
- `type`: Filter by mutation type ('debit' or 'credit') (optional)

**Example:** `GET /api/mut?limit=10&type=debit`

**Response:**
```json
{
  "success": true,
  "data": {
    "mutations": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174003",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "balance": 900.00,
        "prev_balance": 1000.00,
        "type": "debit",
        "catatan": "456e7890-e89b-12d3-a456-426614174001",
        "transaction_id": "456e7890-e89b-12d3-a456-426614174001",
        "created_at": "2025-01-28T12:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 10,
      "offset": 0,
      "total": 45,
      "hasMore": false
    },
    "summary": {
      "total_debits": 1500.00,
      "total_credits": 2000.00,
      "net_change": 500.00
    }
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

### System Monitoring

#### GET /api/health

Health check endpoint for monitoring system status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T12:00:00.000Z",
  "uptime": 3600.123,
  "memory": {
    "rss": 134217728,
    "heapTotal": 67108864,
    "heapUsed": 45088768,
    "external": 2097152
  },
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "pass",
      "duration": 15,
      "timestamp": "2025-01-28T12:00:00.000Z"
    },
    "memory": {
      "status": "pass",
      "duration": 2,
      "timestamp": "2025-01-28T12:00:00.000Z"
    }
  }
}
```

#### GET /api/metrics

Retrieve API performance metrics (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 1250,
      "totalErrors": 25,
      "overallErrorRate": 2.0,
      "overallAverageDuration": 145.5,
      "slowRequestRate": 5.2
    },
    "endpoints": {
      "/api/balance": {
        "count": 500,
        "totalDuration": 25000,
        "minDuration": 10,
        "maxDuration": 500,
        "errorCount": 5,
        "averageDuration": 50.0,
        "errorRate": 1.0
      }
    },
    "systemInfo": {
      "uptime": 3600.123,
      "memoryUsage": {
        "rss": 134217728,
        "heapTotal": 67108864,
        "heapUsed": 45088768,
        "external": 2097152
      },
      "nodeVersion": "v18.17.0",
      "platform": "linux",
      "timestamp": "2025-01-28T12:00:00.000Z"
    }
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

## Error Handling

The API uses standardized error responses with appropriate HTTP status codes.

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "message": "Optional additional message",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2025-01-28T12:00:00.000Z",
  "requestId": "req_1234567890_abcdefgh"
}
```

### Common Error Codes

#### Authentication Errors (401)
- `MISSING_API_KEY`: API key is required
- `INVALID_API_KEY`: API key is invalid or revoked
- `UNAUTHORIZED`: Authentication failed

#### Validation Errors (400)
- `VALIDATION_ERROR`: Request validation failed
- `INVALID_JSON`: Invalid JSON in request body
- `INVALID_AMOUNT`: Invalid payment amount
- `SELF_TRANSFER`: Cannot send payment to yourself
- `DUPLICATE_ORDERID`: Order ID already exists

#### Payment Errors (402)
- `INSUFFICIENT_FUNDS`: Account has insufficient funds

#### Not Found Errors (404)
- `RECIPIENT_NOT_FOUND`: Recipient account not found
- `BALANCE_NOT_FOUND`: Balance record not found

#### Forbidden Errors (403)
- `ACCOUNT_SUSPENDED`: Account is suspended or banned

#### Method Not Allowed (405)
- `METHOD_NOT_ALLOWED`: HTTP method not supported

#### Rate Limiting (429)
- `RATE_LIMIT_EXCEEDED`: Too many requests

#### Server Errors (500)
- `INTERNAL_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed
- `PAYMENT_ERROR`: Payment processing failed

## Rate Limiting

Currently, rate limiting is not implemented but the system is designed to support it. Future versions will include rate limiting based on API keys.

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Response data specific to endpoint
  },
  "timestamp": "2025-01-28T12:00:00.000Z"
}
```

## Code Examples

### JavaScript/Node.js

```javascript
// Get user balance
async function getBalance(apiKey) {
  const response = await fetch('https://your-api.com/api/balance', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  const result = await response.json();

  if (result.success) {
    console.log('Balance:', result.data.balance);
  } else {
    console.error('Error:', result.error);
  }
}

// Process payment
async function sendPayment(apiKey, recipientId, amount) {
  const response = await fetch('https://your-api.com/api/pay', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipientId,
      amount,
      orderid: `ORDER_${Date.now()}`,
      bayarvia: 'transfer'
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log('Payment successful:', result.data.transactionId);
  } else {
    console.error('Payment failed:', result.error);
  }
}
```

### Python

```python
import requests

def get_balance(api_key):
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }

    response = requests.get('https://your-api.com/api/balance', headers=headers)
    result = response.json()

    if result.get('success'):
        print(f"Balance: {result['data']['balance']}")
    else:
        print(f"Error: {result['error']}")

def send_payment(api_key, recipient_id, amount):
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }

    data = {
        'recipientId': recipient_id,
        'amount': amount,
        'orderid': f'ORDER_{int(time.time())}',
        'bayarvia': 'transfer'
    }

    response = requests.post('https://your-api.com/api/pay',
                           headers=headers, json=data)
    result = response.json()

    if result.get('success'):
        print(f"Payment successful: {result['data']['transactionId']}")
    else:
        print(f"Payment failed: {result['error']}")
```

### cURL

```bash
# Get balance
curl -X GET "https://your-api.com/api/balance" \
  -H "x-api-key: your_api_key_here" \
  -H "Content-Type: application/json"

# Send payment
curl -X POST "https://your-api.com/api/pay" \
  -H "x-api-key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 100.00,
    "orderid": "ORDER_12345",
    "bayarvia": "transfer"
  }'
```

## Security Considerations

1. **API Key Security**: Treat API keys like passwords - never expose them in client-side code
2. **HTTPS**: Always use HTTPS for API requests
3. **Input Validation**: All inputs are validated on the server side
4. **Error Messages**: Error messages don't expose sensitive information
5. **Rate Limiting**: Monitor API usage to prevent abuse
6. **Logging**: All requests are logged for security and debugging purposes

## Support

For API support, questions, or to report issues, please contact the development team.