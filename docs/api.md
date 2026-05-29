# 🔌 API Reference

**Complete API documentation for the Modern POS System**

## 📋 **Overview**

The Modern POS System provides a comprehensive REST API for all operations including authentication, product management, sales processing, and reporting. All endpoints are protected by JWT authentication and include proper error handling.

## 🔐 **Authentication**

### **Base URL**
```
http://localhost:3000/api
```

### **Headers Required**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **JWT Token**
- **Expiration**: 24 hours
- **Refresh**: Automatic on valid requests
- **Storage**: HTTP-only cookies

## 🔑 **Authentication Endpoints**

### **POST /api/auth/login**
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "admin@shop.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "admin@shop.com",
    "role": "ADMIN"
  },
  "token": "jwt_token_here"
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials
- `500` - Server error

### **POST /api/auth/logout**
Logout user and invalidate JWT token.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 📦 **Product Management**

### **GET /api/products**
Retrieve all products with optional filtering.

**Query Parameters:**
- `search` (string) - Search by name or SKU
- `category` (string) - Filter by category
- `page` (number) - Page number for pagination
- `limit` (number) - Items per page

**Response:**
```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Premium T-Shirt",
      "sku": "TSH-001",
      "price": 25000,
      "cost": 15000,
      "stock": 50,
      "category": {
        "id": "category_id",
        "name": "T-Shirts"
      },
      "barcode": "123456789",
      "description": "High-quality cotton t-shirt"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### **GET /api/products/[id]**
Retrieve a specific product by ID.

**Response:**
```json
{
  "product": {
    "id": "product_id",
    "name": "Premium T-Shirt",
    "sku": "TSH-001",
    "price": 25000,
    "cost": 15000,
    "stock": 50,
    "category": {
      "id": "category_id",
      "name": "T-Shirts"
    },
    "barcode": "123456789",
    "description": "High-quality cotton t-shirt"
  }
}
```

### **POST /api/products**
Create a new product.

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "NP-001",
  "price": 30000,
  "cost": 20000,
  "stock": 100,
  "categoryId": "category_id",
  "barcode": "987654321",
  "description": "Product description"
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "new_product_id",
    "name": "New Product",
    "sku": "NP-001",
    "price": 30000,
    "cost": 20000,
    "stock": 100,
    "categoryId": "category_id",
    "barcode": "987654321",
    "description": "Product description"
  }
}
```

### **PUT /api/products/[id]**
Update an existing product.

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 35000,
  "stock": 75
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "product_id",
    "name": "Updated Product Name",
    "sku": "TSH-001",
    "price": 35000,
    "cost": 15000,
    "stock": 75,
    "categoryId": "category_id",
    "barcode": "123456789",
    "description": "High-quality cotton t-shirt"
  }
}
```

### **DELETE /api/products/[id]**
Delete a product.

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

## 📥 **Bulk Import API**

### **POST /api/products/import**
Import multiple products from CSV file.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Body**: Form data with `file` field containing CSV

**CSV Format:**
```csv
name,sku,price,cost,stock,category,description,barcode
"Product 1","SKU-001",25000,15000,50,"Category 1","Description 1","123456789"
"Product 2","SKU-002",30000,20000,30,"Category 2","Description 2","987654321"
```

**Response:**
```json
{
  "message": "Import completed",
  "results": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "errors": [
      "Row 10: Missing required fields",
      "Row 15: Invalid numeric values"
    ]
  }
}
```

**Features:**
- ✅ **Auto Category Creation** - New categories created automatically
- ✅ **Duplicate Handling** - Updates existing products by SKU
- ✅ **Data Validation** - Checks required fields and data types
- ✅ **Error Reporting** - Detailed import results with error details

## 📂 **Category Management**

### **GET /api/categories**
Retrieve all categories.

**Response:**
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "T-Shirts",
      "productCount": 25
    }
  ]
}
```

### **POST /api/categories**
Create a new category.

**Request Body:**
```json
{
  "name": "New Category"
}
```

**Response:**
```json
{
  "success": true,
  "category": {
    "id": "new_category_id",
    "name": "New Category"
  }
}
```

### **PUT /api/categories/[id]**
Update a category.

**Request Body:**
```json
{
  "name": "Updated Category Name"
}
```

### **DELETE /api/categories/[id]**
Delete a category.

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

## 💰 **Sales Management**

### **GET /api/sales**
Retrieve sales with optional filtering.

**Query Parameters:**
- `date` (string) - Filter by date (YYYY-MM-DD)
- `startDate` (string) - Start date for range
- `endDate` (string) - End date for range
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:**
```json
{
  "sales": [
    {
      "id": "sale_id",
      "total": 75000,
      "paymentType": "CASH",
      "discount": 5000,
      "createdAt": "2025-08-26T10:30:00Z",
      "customer": {
        "id": "customer_id",
        "name": "John Doe"
      },
      "items": [
        {
          "id": "item_id",
          "product": {
            "name": "Premium T-Shirt",
            "sku": "TSH-001"
          },
          "quantity": 2,
          "price": 25000
        }
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### **POST /api/sales**
Create a new sale.

**Request Body:**
```json
{
  "customerId": "customer_id",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 25000
    }
  ],
  "paymentType": "CASH",
  "discount": 5000
}
```

**Response:**
```json
{
  "success": true,
  "sale": {
    "id": "new_sale_id",
    "total": 45000,
    "paymentType": "CASH",
    "discount": 5000,
    "createdAt": "2025-08-26T10:30:00Z"
  }
}
```

### **GET /api/sales/[id]**
Retrieve a specific sale by ID.

**Response:**
```json
{
  "sale": {
    "id": "sale_id",
    "total": 75000,
    "paymentType": "CASH",
    "discount": 5000,
    "createdAt": "2025-08-26T10:30:00Z",
    "customer": {
      "id": "customer_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "09123456789"
    },
    "items": [
      {
        "id": "item_id",
        "product": {
          "id": "product_id",
          "name": "Premium T-Shirt",
          "sku": "TSH-001"
        },
        "quantity": 2,
        "price": 25000
      }
    ]
  }
}
```

## 👥 **Customer Management**

### **GET /api/customers**
Retrieve all customers.

**Query Parameters:**
- `search` (string) - Search by name, email, or phone
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:**
```json
{
  "customers": [
    {
      "id": "customer_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "09123456789",
      "address": "123 Main St, Yangon",
      "totalPurchases": 5,
      "totalSpent": 250000
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### **POST /api/customers**
Create a new customer.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "09876543210",
  "address": "456 Oak St, Yangon"
}
```

### **GET /api/customers/[id]**
Retrieve a specific customer by ID.

### **PUT /api/customers/[id]**
Update a customer.

### **DELETE /api/customers/[id]**
Delete a customer.

## 📊 **Reports & Analytics**

### **GET /api/reports/sales**
Get sales analytics and reports.

**Query Parameters:**
- `period` (string) - "daily", "weekly", "monthly"
- `startDate` (string) - Start date
- `endDate` (string) - End date

**Response:**
```json
{
  "summary": {
    "totalSales": 150,
    "totalRevenue": 4500000,
    "averageOrderValue": 30000,
    "topProducts": [
      {
        "name": "Premium T-Shirt",
        "quantity": 45,
        "revenue": 1125000
      }
    ]
  },
  "dailyData": [
    {
      "date": "2025-08-26",
      "sales": 8,
      "revenue": 240000
    }
  ],
  "paymentMethods": {
    "CASH": 60,
    "CARD": 25,
    "MOBILE_PAY": 15
  }
}
```

### **GET /api/reports/export**
Export sales data to CSV.

**Query Parameters:**
- `startDate` (string) - Start date
- `endDate` (string) - End date
- `format` (string) - "csv" or "excel"

**Response:**
- **Content-Type**: `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Body**: CSV/Excel file content

## 🔍 **Search & Filtering**

### **GET /api/search**
Global search across products, customers, and sales.

**Query Parameters:**
- `q` (string) - Search query
- `type` (string) - "products", "customers", "sales", or "all"

**Response:**
```json
{
  "results": {
    "products": [
      {
        "id": "product_id",
        "name": "Premium T-Shirt",
        "sku": "TSH-001",
        "category": "T-Shirts"
      }
    ],
    "customers": [
      {
        "id": "customer_id",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "sales": [
      {
        "id": "sale_id",
        "total": 75000,
        "createdAt": "2025-08-26T10:30:00Z"
      }
    ]
  }
}
```

## ⚠️ **Error Handling**

All API endpoints return consistent error responses:

### **Error Response Format**
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### **Common Error Codes**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

### **Validation Errors**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "Product name is required",
    "price": "Price must be a positive number"
  }
}
```

## 🔒 **Security & Rate Limiting**

### **Authentication Required**
All endpoints (except login) require valid JWT token.

### **Rate Limiting**
- **General APIs**: 100 requests per minute
- **Import APIs**: 10 requests per minute
- **Search APIs**: 50 requests per minute

### **Input Validation**
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token-based request validation

## 📱 **Mobile Optimization**

### **Response Headers**
```http
Cache-Control: public, max-age=300
Content-Type: application/json; charset=utf-8
X-Response-Time: 45ms
```

### **Pagination**
All list endpoints support pagination for mobile performance:
- **Default Limit**: 20 items per page
- **Max Limit**: 100 items per page
- **Page Navigation**: Next/previous page links

### **Data Compression**
- **Gzip Compression**: Enabled for all responses
- **Minimal Payload**: Only essential data included
- **Lazy Loading**: Large datasets loaded on demand

## 🧪 **Testing the API**

### **Using cURL**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shop.com","password":"admin123"}'

# Get products (with token)
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Using Postman**
1. **Import Collection**: Download our Postman collection
2. **Set Environment**: Configure base URL and variables
3. **Login First**: Get JWT token from login endpoint
4. **Use Token**: Set Authorization header for all requests

### **Using Thunder Client (VS Code)**
1. **Install Extension**: Thunder Client extension
2. **Create Collection**: Import our API collection
3. **Set Variables**: Configure environment variables
4. **Test Endpoints**: Run requests directly in VS Code

## 📚 **SDK & Libraries**

### **JavaScript/TypeScript**
```typescript
class POSClient {
  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getProducts() {
    const response = await fetch(`${this.baseUrl}/api/products`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
}
```

### **Python**
```python
import requests

class POSClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_products(self):
        response = requests.get(
            f'{self.base_url}/api/products',
            headers=self.headers
        )
        return response.json()
```

## 🔄 **WebSocket Support (Future)**

Planned WebSocket endpoints for real-time updates:
- **Live Stock Updates** - Real-time inventory changes
- **Sales Notifications** - Instant sale confirmations
- **System Alerts** - Low stock and system notifications

---

**📖 For more details, see the [Project Details](projectdetail.md) documentation.**
