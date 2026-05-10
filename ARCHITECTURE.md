# Architecture & System Design

## System Overview

BundlePro is a scalable SaaS platform for data bundle management built with Next.js, featuring:
- Multi-tenant architecture (each user has isolated data)
- Real-time data parsing and calculation
- Intelligent duplicate detection
- Multi-provider API integration
- Modern responsive UI

---

## Core Components

### 1. Parser (`src/lib/parser.ts`)

**Purpose**: Extract and normalize phone numbers and gig amounts from raw text.

**Key Functions**:
- `parseRawInput()`: Main entry point, returns bundles and errors
- `extractPhoneNumber()`: Regex extraction for 10-digit Nigerian numbers
- `normalizeGigAmount()`: Convert "5GB", "5gb", "5 GB" → 5
- `isValidPhoneNumber()`: Validation check

**Algorithm**:
```
For each line:
1. Split by space, comma, or tab
2. Find 10-digit phone number
3. Find numeric gig amount
4. Validate both
5. Add to bundles or errors array
```

**Supported Formats**:
- `0557574477 5` → phone: 0557574477, gigs: 5
- `0557574477 5GB` → phone: 0557574477, gigs: 5
- `0557574477, 5` → comma separated
- `0557574477	5` → tab separated

---

### 2. Calculation Engine (`src/lib/calculation.ts`)

**Purpose**: Calculate totals and provide pricing breakdown.

**Key Functions**:
- `calculateTotals()`: Main calculation function
- `getPriceForGigAmount()`: O(1) lookup from pricing map
- `formatCalculationResult()`: Format for display

**Algorithm**:
```
1. Create pricing map for O(1) lookups
2. For each bundle:
   - Add gigAmount to totalGigs
   - Look up price in map
   - Add to totalPrice
   - Add to breakdown map
3. Calculate averagePrice
4. Return formatted result
```

**Handles**:
- Missing prices (defaults to 0)
- Breakdown by gig amount
- Average price calculation
- Large datasets efficiently

---

### 3. Duplicate Detection (`src/lib/duplicates.ts`)

**Purpose**: Identify and flag duplicate phone numbers.

**Key Functions**:
- `findDuplicatesInPaste()`: Find duplicates within current paste
- `checkLast24hRecords()`: Database lookup for 24-hour records
- `separateDuplicates()`: Categorize bundles into clean/flagged
- `performDuplicateCheck()`: Complete duplicate checking flow

**Algorithm**:
```
1. Build phone map from paste
2. Find all phones with count > 1
3. For unique phones, check database (last 24h)
4. For each bundle:
   - If phone in same_paste duplicates → flag
   - If phone in last_24h records → flag
   - Otherwise → clean
5. Return separated arrays with statistics
```

**Performance**:
- Same-paste: O(n) with hash map
- Database check: SQL query with DISTINCT
- Separation: O(n) single pass

---

### 4. Database Schema

```prisma
User
├── id (String, @id, @default(cuid()))
├── email (String, @unique)
├── password (String)
├── relations: [PriceList, APICredential, Bundle, Order, DuplicateRecord]

PriceList
├── userId, gigAmount (@@unique)
├── price (Float)
├── isActive (Boolean)

APICredential  
├── userId, provider (@@unique)
├── apiKey (String, encrypted in production)
├── endpoint (String)
├── isActive (Boolean)

Bundle
├── userId, phoneNumber
├── gigAmount, price
├── status (pending|processing|completed|failed)
├── orderId (foreign key)
├── Indexes: userId, phoneNumber, status, createdAt

Order
├── userId
├── totalGigs, totalPrice, itemCount
├── status (pending|processing|completed|failed)
├── relation: [Bundle]

DuplicateRecord
├── userId, phoneNumber
├── count, duplicateType, lastServedAt
├── flaggedAt, resolvedAt
├── Indexes: userId, phoneNumber, flaggedAt
```

---

### 5. API Endpoints

#### Bundle Parsing
```
POST /api/bundles/parse
Input: { rawText: string }
Output: { 
  bundles: [{phoneNumber, gigAmount}],
  calculations: {totalGigs, totalPrice, itemCount},
  parseErrors: [{line, reason}]
}
```

#### Duplicate Checking
```
POST /api/bundles/check-duplicates
Input: { bundles: [{phoneNumber, gigAmount}] }
Output: {
  cleanOrders: [...],
  flaggedDuplicates: [{phoneNumber, count, type, lastServedAt}],
  statistics: {...}
}
```

#### Process and Send
```
POST /api/bundles/process-and-send
Input: { bundles: [...], provider: string }
Output: {
  orderId: string,
  totalProcessed: number,
  successCount: number,
  failureCount: number,
  results: [{phoneNumber, status, transactionId|error}]
}
```

---

### 6. State Management (Zustand)

**Stores**:
```typescript
useBundleStore
├── parsedBundles: Bundle[]
├── cleanBundles: Bundle[]
├── flaggedBundles: DuplicateInfo[]
├── totalGigs, totalPrice, itemCount: number
├── isLoading, error, successMessage: state
└── actions: setParsedBundles, setCleanBundles, etc.

usePricingStore
├── pricingList: PricingEntry[]
└── actions: setPricingList, addPricingItem, removePricingItem

useCredentialStore
├── credentials: APICredential[]
└── actions: setCredentials, addCredential, removeCredential, updateCredential
```

**Advantages**:
- Minimal re-renders
- Efficient updates
- Easy to debug with middleware
- No prop drilling

---

## Data Flow

### Complete Flow: Parse → Calculate → Check Duplicates → Send

```
User enters data in textarea
        ↓
[Parse API] → Extract phone numbers and gigs
        ↓
[Calculation] → Look up prices, calculate totals
        ↓
Display stats and parsed data
        ↓
User clicks "Check Duplicates"
        ↓
[Find duplicates in paste] (O(n))
        ↓
[Check database for last 24h] (SQL query)
        ↓
[Separate into clean/flagged] (O(n))
        ↓
Display results with breakdown
        ↓
User clicks "Process Clean Orders"
        ↓
[Send each to VTU provider API]
        ↓
[Save to database]
        ↓
Update order status
        ↓
Show results and receipt
```

---

## Performance Optimizations

### 1. Database Queries
```prisma
// Get last 24h bundles efficiently
bundle.findMany({
  where: {
    userId,
    phoneNumber: { in: phoneNumbers },
    status: "completed",
    processedAt: { gte: last24hDate },
  },
  select: { phoneNumber, processedAt },
  distinct: ["phoneNumber"], // Only one per phone
})
```

### 2. Client-Side Caching
- Zustand stores data in memory
- No re-fetching same data
- Fast UI updates

### 3. Regex Compilation
```typescript
// Compile regex once, not in loop
const pattern = /\b(\d{10})\b/;
for (const line of lines) {
  const match = pattern.exec(line);
}
```

### 4. Map-Based Lookups
```typescript
// O(1) pricing lookup instead of O(n) array search
const pricingMap = new Map();
for (const entry of table) {
  pricingMap.set(entry.gigAmount, entry.price);
}
```

---

## Scalability Considerations

### Handling Millions of Orders

**1. Pagination**:
- Limit query results
- Implement cursor-based pagination
- Virtual scrolling for UI lists

**2. Indexing**:
- userId (for multi-tenancy)
- phoneNumber (for duplicate checks)
- status (for filtering)
- createdAt (for date-based queries)

**3. Batch Processing**:
```typescript
// Process in chunks, not all at once
const BATCH_SIZE = 100;
for (let i = 0; i < bundles.length; i += BATCH_SIZE) {
  const batch = bundles.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
}
```

**4. Connection Pooling**:
- Prisma manages pool automatically
- Set in DATABASE_URL or config

**5. Caching**:
- Redis for frequently accessed data
- Cache pricing tables
- Cache API credentials

---

## Security Architecture

### Authentication Flow
```
User signs up/in → Credentials validated → JWT created → Stored in session
                                          → Attached to all requests
                                          → Verified on protected routes
```

### Data Isolation
```
Every query filters by userId:
  const bundles = await prisma.bundle.findMany({
    where: { userId: session.user.id } // Always filter!
  });
```

### API Key Storage
**Current** (NOT SECURE):
- Keys stored plaintext in database

**Production** (REQUIRED):
```typescript
import crypto from 'crypto';

// Encrypt before storing
const encrypted = crypto
  .createCipheriv('aes-256-cbc', key, iv)
  .update(apiKey)
  .final();

// Decrypt when needed
const decrypted = crypto
  .createDecipheriv('aes-256-cbc', key, iv)
  .update(encrypted)
  .final();
```

---

## Error Handling Strategy

### Three Layers:

**1. Parser Level**:
```typescript
// Skip bad lines, collect errors
const errors = [];
for (const line of lines) {
  try {
    // Parse...
  } catch (e) {
    errors.push({ line, reason: e.message });
  }
}
return { bundles, errors };
```

**2. API Level**:
```typescript
// Validate input, catch database errors
if (!bundles || !Array.isArray(bundles)) {
  return res.status(400).json({ error: "Invalid input" });
}

try {
  // Process...
} catch (error) {
  return res.status(500).json({ error: error.message });
}
```

**3. UI Level**:
```typescript
// Show errors to user
{error && (
  <div className="bg-red-50 p-4 rounded-lg">
    {error}
  </div>
)}
```

---

## Testing Strategy

### Unit Tests (Parser, Calculator)
```typescript
test('parseRawInput handles multiple formats', () => {
  const result = parseRawInput('0557574477 5\n0557574478 10GB');
  expect(result.bundles).toHaveLength(2);
});
```

### Integration Tests (API Routes)
```typescript
test('POST /api/bundles/parse returns calculation', async () => {
  const response = await fetch('/api/bundles/parse', {
    method: 'POST',
    body: JSON.stringify({ rawText: '0557574477 5' })
  });
  expect(response.status).toBe(200);
});
```

### E2E Tests (Full Flow)
```typescript
test('Complete workflow: parse → calculate → check duplicates', async () => {
  // Login
  // Upload data
  // Check results
  // Verify duplicates
  // Send to API
  // Verify order created
});
```

---

## Monitoring & Logging

### What to Log:
- All API requests with user ID
- Parsing errors with line numbers
- API provider responses
- Database query duration
- Error stack traces

### Logging Example:
```typescript
console.log({
  timestamp: new Date(),
  userId: session.user.id,
  action: 'parse_data',
  bundleCount: bundles.length,
  errorCount: errors.length,
  duration: Date.now() - startTime
});
```

---

## Deployment Architecture

### Production Setup:
```
                    ┌─────────────┐
                    │  Vercel/   │
                    │  Netlify   │
                    │ (Frontend) │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │  API Route 1  │  │  API Route 2  │  │  API Route N  │
      └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                        ┌──────┴──────┐
                        │ PostgreSQL  │
                        │  Database   │
                        └─────────────┘
```

---

This architecture supports:
- ✅ Multi-tenant SaaS
- ✅ Real-time data processing
- ✅ Millions of orders
- ✅ Scalable to multiple servers
- ✅ Easy to monitor and debug
