# BundlePro - Data Bundle Management System

A comprehensive SaaS platform for managing and automating data bundle distribution with built-in duplicate detection, custom pricing, and multi-provider API integration.

## Features

✨ **Core Features:**
- **Smart Data Parsing**: Automatically extract phone numbers (10-digit) and gig amounts from various text formats
- **Calculation Engine**: Calculate total gigs and prices based on user's custom pricing table
- **Duplicate Detection**: Identify duplicates in the same paste and cross-reference 24-hour database
- **API Automation**: Integrate with multiple VTU providers for automatic bundle processing
- **Settings Management**: Manage API credentials and pricing tables easily
- **Real-time Dashboard**: Modern UI with stat cards and analytics
- **Bulk Processing**: Handle millions of orders with efficient state management

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Validation**: Regex-based parsing with custom validation

## Project Structure

```
bundle pro/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Main dashboard
│   │   │   ├── settings/page.tsx  # Settings for credentials & pricing
│   │   │   ├── orders/page.tsx    # Orders history
│   │   │   └── analytics/page.tsx # Analytics & stats
│   │   ├── auth/
│   │   │   ├── signin/page.tsx    # Sign in page
│   │   │   └── signup/page.tsx    # Sign up page
│   │   ├── page.tsx               # Home page
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Global styles
│   ├── pages/api/
│   │   ├── auth/
│   │   │   ├── [...nextauth].ts   # NextAuth configuration
│   │   │   └── signup.ts          # Sign up API
│   │   ├── bundles/
│   │   │   ├── parse.ts           # Parse raw data
│   │   │   ├── check-duplicates.ts# Check duplicates
│   │   │   ├── check-last-24h.ts  # Check 24h records
│   │   │   └── process-and-send.ts# Send to VTU provider
│   │   ├── credentials/
│   │   │   └── index.ts           # Manage API credentials
│   │   └── pricing/
│   │       └── index.ts           # Manage pricing table
│   ├── components/
│   │   ├── DashboardLayout.tsx    # Main layout with sidebar
│   │   ├── StatCard.tsx           # Stat card component
│   │   ├── BundleParserForm.tsx   # Parser form
│   │   └── DuplicateChecker.tsx   # Duplicate checker
│   ├── lib/
│   │   ├── parser.ts              # Data parsing utilities
│   │   ├── calculation.ts         # Calculation engine
│   │   ├── duplicates.ts          # Duplicate detection logic
│   │   └── prisma.ts              # Prisma client
│   └── store/
│       └── index.ts               # Zustand stores
├── prisma/
│   └── schema.prisma              # Database schema
├── public/                        # Static files
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Database Schema

### Core Models:
- **User**: User account and authentication
- **PriceList**: Custom pricing for different gig amounts
- **APICredential**: VTU provider API keys and endpoints
- **Bundle**: Individual bundle orders
- **Order**: Group of bundles processed together
- **DuplicateRecord**: Flagged duplicates for audit

## Installation & Setup

### 1. Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 2. Clone & Install
```bash
cd "bundle pro"
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your configuration
```

**.env.local required variables:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bundle_management"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed demo data
npm run prisma:seed
```

### 5. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000 to access the application.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Bundle Processing
- `POST /api/bundles/parse` - Parse raw text data
- `POST /api/bundles/check-duplicates` - Check for duplicates
- `POST /api/bundles/check-last-24h` - Check 24-hour records
- `POST /api/bundles/process-and-send` - Send to VTU provider

### Settings
- `GET /api/credentials` - Get API credentials
- `POST /api/credentials` - Add/update credentials
- `DELETE /api/credentials` - Delete credentials
- `GET /api/pricing` - Get pricing table
- `POST /api/pricing` - Add/update pricing
- `DELETE /api/pricing` - Delete pricing

## Usage Guide

### 1. Setup Pricing Table
1. Go to Settings → Add Pricing
2. Add your pricing for each gig amount (e.g., 5GB → GH₵250)
3. Click "Add Price"

### 2. Add VTU Provider Credentials
1. Go to Settings → Add API Credentials
2. Select provider (MTN, Airtel, Glo, Etisalat)
3. Enter API Key and Endpoint
4. Click "Add Credentials"

### 3. Process Bundle Data
1. Go to Dashboard
2. Paste your data in the format:
   - `0557574477 5` (phone + gig amount)
   - `0557574477 5GB` (phone + gig with unit)
   - Comma or tab separated also supported
3. Click "Parse Data"
4. Review calculations (Total Gigs, Total Price, Order Count)
5. Click "Check Duplicates" to identify duplicates
6. Review Clean Orders vs Flagged Duplicates
7. Click "Process Clean Orders" to send to API

### 4. View Analytics
- Dashboard shows real-time stats
- Orders page shows processing history
- Analytics page shows trends and insights

## Data Format Examples

**Accepted formats:**
```
0557574477 5
0557574477 5GB
0557574477 5 GB
0557574477, 5
0557574477	5
```

**Phone numbers:**
- 10-digit Nigerian numbers: 0557574477
- Will also accept international formats: +2340557574477, 2340557574477

## Key Features Explained

### Parser
Uses regex to extract:
- 10-digit phone numbers
- Gig amounts (with or without "GB" suffix)
- Normalizes all formats to standard numeric values

### Calculation Engine
- Sums all gig amounts for total
- Looks up each amount in user's pricing table
- Calculates total revenue
- Groups by gig amount for breakdown

### Duplicate Checker
1. **Same Paste Duplicates**: Identifies phone numbers appearing multiple times in current paste
2. **24-Hour Duplicates**: Checks database for numbers processed in last 24 hours
3. **Combined Report**: Shows clean orders vs flagged duplicates with details

### API Integration
- Sends clean orders to VTU provider endpoints
- Handles authorization with API keys
- Tracks transaction IDs
- Logs success/failure per bundle
- Updates order status automatically

## Performance & Scalability

### Handling Millions of Orders:
- **Zustand Store**: Efficient client-side state management
- **Prisma Queries**: Optimized with indexes and batch operations
- **Streaming**: Process large datasets without blocking UI
- **Database Indexes**: On phoneNumber, status, createdAt
- **Pagination**: Implemented for list views

### Optimization Techniques:
- Distinct queries for duplicate detection
- Batch processing for bulk orders
- Efficient date filtering for 24-hour checks
- Map-based lookups for O(1) pricing queries
- Virtual scrolling for large lists (optional enhancement)

## Authentication

- Uses NextAuth.js with Credentials Provider
- Stores users in PostgreSQL
- Supports JWT sessions
- Auto-redirects to signin for protected pages
- 30-day session expiry

## Security Considerations

⚠️ **Production Improvements Needed:**
1. Hash passwords with bcrypt before storing
2. Add rate limiting on API endpoints
3. Validate/sanitize all inputs
4. Add CORS configuration
5. Encrypt sensitive credentials in database
6. Implement request logging
7. Add email verification for signups
8. Implement API key rotation

## Error Handling

### Parser Errors:
- Invalid phone numbers are skipped with reason
- Missing gig amounts logged
- Malformed lines reported to user

### Duplicate Check:
- Database connectivity issues handled gracefully
- API timeouts with retry logic
- Partial results returned if some checks fail

### API Submission:
- Per-bundle error handling
- Transaction tracking
- Partial success support (some succeed, some fail)
- Error messages logged and returned

## Troubleshooting

### Database Connection Issues
```bash
# Check connection string in .env.local
# Verify PostgreSQL is running
# Test with: psql $DATABASE_URL
```

### Prisma Migration Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View pending migrations
npx prisma migrate status
```

### Session Not Persisting
- Check NEXTAUTH_SECRET is set in .env.local
- Verify database connection
- Clear browser cookies and retry
- Check session expiry in nextauth config

## Future Enhancements

- [ ] Real-time progress updates with WebSockets
- [ ] Email notifications for bulk operations
- [ ] Scheduled task automation
- [ ] Provider-specific API templating
- [ ] Advanced filtering and search
- [ ] Export orders to CSV/Excel
- [ ] Custom webhook handlers
- [ ] Multi-currency support
- [ ] Team collaboration features
- [ ] Mobile app

## Contributing

This is a production-ready template. Feel free to customize for your specific use case.

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check database schema for data structure
4. Inspect browser console for client-side errors
5. Check server logs for backend errors

---

**Built with ❤️ for data bundle management at scale**
