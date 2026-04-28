# Voucher Remittance API

A complete backend system for voucher-based remittance using Next.js API routes and PostgreSQL.

## 🚀 Quick Start

1. **Setup Database**
   ```bash
   # Install PostgreSQL
   # Create database
   createdb voucher_remittance
   
   # Copy environment file
   cp .env.example .env
   
   # Update .env with your database credentials
   ```

2. **Initialize Database**
   ```bash
   npx ts-node scripts/init-db.ts
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### 1. Create Voucher
```
POST /api/voucher/create
Content-Type: application/json

{
  "amount_usd": 50
}

Response:
{
  "success": true,
  "voucher_code": "GH-ABCD-1234",
  "amount_ghs": 625.00,
  "amount_usd": 50
}
```

### 2. Validate Voucher
```
POST /api/voucher/validate
Content-Type: application/json

{
  "code": "GH-ABCD-1234"
}

Response:
{
  "success": true,
  "valid": true,
  "amount_ghs": 625.00,
  "status": "paid",
  "message": "Voucher is valid"
}
```

### 3. Claim Voucher
```
POST /api/voucher/claim
Content-Type: application/json

{
  "code": "GH-ABCD-1234",
  "receiver_name": "John Doe",
  "receiver_phone": "+233-555-0123",
  "network": "MTN"
}

Response:
{
  "success": true,
  "message": "Voucher claimed successfully",
  "voucher": {
    "id": 1,
    "code": "GH-ABCD-1234",
    "amount_usd": 50.00,
    "amount_ghs": 625.00,
    "status": "pending",
    "receiver_name": "John Doe",
    "receiver_phone": "+233-555-0123",
    "network": "MTN",
    "created_at": "2024-03-20T15:30:00.000Z",
    "claimed_at": "2024-03-20T15:35:00.000Z"
  }
}
```

### 4. Get All Vouchers (Admin)
```
GET /api/admin/vouchers

Response:
{
  "success": true,
  "count": 5,
  "vouchers": [
    {
      "id": 1,
      "code": "GH-ABCD-1234",
      "amount_usd": 50.00,
      "amount_ghs": 625.00,
      "status": "completed",
      "receiver_name": "John Doe",
      "receiver_phone": "+233-555-0123",
      "network": "MTN",
      "created_at": "2024-03-20T15:30:00.000Z",
      "claimed_at": "2024-03-20T15:35:00.000Z"
    }
  ]
}
```

### 5. Update Voucher Status (Admin)
```
POST /api/admin/update
Content-Type: application/json

{
  "code": "GH-ABCD-1234",
  "status": "completed"
}

Response:
{
  "success": true,
  "message": "Voucher status updated to completed",
  "voucher": {
    "id": 1,
    "code": "GH-ABCD-1234",
    "status": "completed"
  }
}
```

## 🗄️ Database Schema

```sql
CREATE TABLE vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  amount_ghs DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'paid',
  receiver_name VARCHAR(255),
  receiver_phone VARCHAR(20),
  network VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP
);
```

## 📊 Voucher Status Flow

1. **paid** → Voucher created, ready to be claimed
2. **pending** → Voucher claimed, waiting for admin approval
3. **completed** → Admin approved, money transferred
4. **rejected** → Admin rejected, no transfer
5. **expired** → Voucher expired (future feature)

## 🔄 Business Logic

- **Voucher Generation**: Unique codes in format `GH-XXXX-XXXX`
- **Exchange Rate**: Fixed at 1 USD = 12.5 GHS (configurable)
- **Validation Rules**:
  - Voucher can only be claimed once
  - Cannot claim if already pending/completed
  - Status transitions are controlled
- **Uniqueness**: Database ensures unique voucher codes

## 🛠️ Development

### File Structure
```
lib/
├── db.ts              # Database connection
└── voucher-utils.ts    # Database operations and utilities

app/api/
├── voucher/
│   ├── create/         # Create new voucher
│   ├── validate/       # Validate voucher code
│   └── claim/         # Claim voucher with details
└── admin/
    ├── vouchers/       # Get all vouchers
    └── update/        # Update voucher status

scripts/
└── init-db.ts        # Database initialization
```

### Environment Variables
```bash
DB_USER=postgres          # Database username
DB_HOST=localhost          # Database host
DB_NAME=voucher_remittance # Database name
DB_PASSWORD=password       # Database password
DB_PORT=5432            # Database port
```

## 🧪 Testing

Use the GET endpoints to see API documentation and test with curl:

```bash
# Create voucher
curl -X POST http://localhost:3000/api/voucher/create \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 100}'

# Validate voucher
curl -X POST http://localhost:3000/api/voucher/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "GH-ABCD-1234"}'

# Get all vouchers
curl http://localhost:3000/api/admin/vouchers
```

## 🔒 Security Notes

- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- Error handling without sensitive data exposure
- Status validation to prevent invalid transitions
