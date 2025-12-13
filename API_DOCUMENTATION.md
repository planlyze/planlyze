# Planlyze API Documentation

## Swagger UI

View all available APIs with full documentation and test them directly:

**URL:** http://localhost:3000/api/docs

The Swagger UI provides:
- 📋 Complete list of all endpoints
- 📝 Request/response models
- 🧪 Try-it-out interface to test APIs directly
- 🔐 Authorization bearer token support
- 📚 Detailed descriptions for each parameter

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Create new account
- **POST** `/api/auth/login` - Login with credentials
- **GET** `/api/auth/me` - Get current user profile
- **PUT** `/api/auth/me` - Update user profile
- **POST** `/api/auth/change-password` - Change password
- **POST** `/api/auth/logout` - Logout

### Analyses
- **GET** `/api/analyses` - List all user analyses
- **POST** `/api/analyses` - Create new analysis
- **GET** `/api/analyses/<id>` - Get analysis details
- **PUT** `/api/analyses/<id>` - Update analysis
- **DELETE** `/api/analyses/<id>` - Delete analysis

### Credits
- **GET** `/api/credits/packages` - Get available credit packages
- **POST** `/api/credits/purchase` - Purchase credits
- **GET** `/api/credits/balance` - Get current credit balance

### Transactions
- **GET** `/api/transactions` - List all transactions
- **GET** `/api/transactions/<id>` - Get transaction details

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

Obtain a token by logging in:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## Example Requests

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "secure123",
    "full_name": "John Doe"
  }'
```

### Create Analysis
```bash
curl -X POST http://localhost:3000/api/analyses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "business_idea": "AI-powered scheduling assistant for small businesses",
    "industry": "SaaS",
    "target_market": "Small business owners",
    "location": "United States",
    "budget": "$50000"
  }'
```

### Get User Profile
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Testing with Swagger

1. Visit http://localhost:3000/api/docs
2. Click "Authorize" button
3. Enter your JWT token (without "Bearer" prefix)
4. Click "Authorize"
5. Now you can test protected endpoints
6. Click "Try it out" on any endpoint
7. Fill in parameters and click "Execute"

## Response Format

All responses follow a consistent format:

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "status": "success"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": 400
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Languages

The API supports multiple languages via the `Accept-Language` header:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Accept-Language: ar" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

Supported languages:
- `en` - English
- `ar` - Arabic

---

**Last Updated:** December 2025
**Version:** 1.0
