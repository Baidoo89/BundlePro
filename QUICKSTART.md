# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd "bundle pro"
npm install
```

### Step 2: Set Up Database
Make sure you have PostgreSQL installed and running.

```bash
# Create a new database
createdb bundle_management

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local and update DATABASE_URL
# Example: DATABASE_URL="postgresql://user:password@localhost:5432/bundle_management"
```

### Step 3: Run Migrations & Seed
```bash
# Create database schema
npm run prisma:generate
npm run prisma:migrate

# Optional: Seed demo data
npx prisma db seed
```

### Step 4: Start Development Server
```bash
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 📝 Demo Credentials

```
Email: demo@example.com
Password: demo123
```

---

## 🎯 First Steps (After Login)

### 1. Set Up Pricing (Settings Page)
Add your data bundle pricing:
- 5GB → GH₵250
- 10GB → GH₵500
- 100GB → GH₵3,500

### 2. Add VTU Provider (Settings Page)
Add your VTU provider credentials:
- Provider: MTN/Airtel/Glo/Etisalat
- API Key: Your provider API key
- Endpoint: Your provider API endpoint

### 3. Parse Bundle Data (Dashboard)
Paste your data:
```
0557574477 5
0557574478 10GB
0557574479, 5
```

Click "Parse Data" to see calculations.

### 4. Check Duplicates
Click "Check Duplicates" to identify and flag duplicates.

### 5. Process Orders
Click "Process Clean Orders" to send to your VTU provider.

---

## 📊 Data Format

**Phone numbers:**
- Must be 10 digits
- Examples: `0557574477`, `2340557574477`, `+2340557574477`

**Gig amounts:**
- Numbers: `5`, `10`, `100`
- With unit: `5GB`, `10gb`, `5 GB`

**Separators:**
- Space: `0557574477 5`
- Comma: `0557574477, 5`
- Tab: `0557574477	5`

**Full example paste:**
```
0557574477 5
0557574478 10GB
0557574479, 5 GB
0557574480	100
```

---

## 🔑 Key Features

### Parser
- Extracts phone numbers and gig amounts
- Handles multiple formats automatically
- Reports parsing errors clearly

### Calculation
- Calculates total gigs and revenue
- Uses your custom pricing table
- Shows breakdown by gig amount

### Duplicate Detection
- Flags duplicates in current paste
- Checks last 24 hours in database
- Separates clean orders from flagged

### API Integration
- Sends clean orders to VTU provider
- Tracks transaction IDs
- Logs all operations

---

## 🗄️ Database Schema Quick Reference

```
User
├── PriceList (1-to-many)
├── APICredential (1-to-many)
├── Bundle (1-to-many)
├── Order (1-to-many)
└── DuplicateRecord (1-to-many)

Bundle
├── links to Order
└── links to User

Order
├── contains many Bundles
└── links to User
```

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database
npx prisma db seed

# Open Prisma Studio (GUI for database)
npx prisma studio
```

---

## 🐛 Common Issues

### "DATABASE_URL not set"
- Copy `.env.local.example` to `.env.local`
- Update DATABASE_URL with your PostgreSQL connection string
- Make sure PostgreSQL is running

### "Authentication failed"
- Check email and password
- Database might not be initialized
- Try seeding: `npx prisma db seed`

### "Port 3000 already in use"
```bash
# Use different port
npm run dev -- -p 3001
```

### "Prisma schema out of sync"
```bash
npm run prisma:generate
npm run prisma:migrate
```

---

## 📚 API Endpoints Quick Reference

### Bundles
- `POST /api/bundles/parse` - Parse raw data
- `POST /api/bundles/check-duplicates` - Check duplicates
- `POST /api/bundles/process-and-send` - Send to provider

### Settings
- `GET /api/pricing` - Get pricing list
- `POST /api/pricing` - Add pricing
- `GET /api/credentials` - Get credentials
- `POST /api/credentials` - Add credentials

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Change NEXTAUTH_SECRET to a long random string
- [ ] Hash passwords with bcrypt (don't store plaintext)
- [ ] Add rate limiting to API routes
- [ ] Encrypt API credentials in database
- [ ] Enable HTTPS
- [ ] Set up proper environment variables
- [ ] Test all VTU provider integrations
- [ ] Set up database backups
- [ ] Add monitoring and error tracking
- [ ] Review security best practices

---

## 📖 Next Steps

1. **Customize Pricing**: Go to Settings and add your pricing
2. **Add Providers**: Register with VTU providers and add credentials
3. **Test Flow**: Use demo data to test the full workflow
4. **Monitor**: Check Orders and Analytics pages
5. **Scale**: Monitor database performance and optimize queries

---

## 💡 Tips & Tricks

**Bulk Testing:**
```
0557574477 5
0557574477 5
0557574478 10GB
0557574479 100
```

**Check Duplicates Workflow:**
1. Parse data
2. Review calculations
3. Click "Check Duplicates"
4. Review Clean vs Flagged
5. Process clean orders only

**Database GUI:**
```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## 📞 Support

For help:
1. Check README.md for detailed documentation
2. Review API endpoint documentation
3. Check database schema in `prisma/schema.prisma`
4. Review component code in `src/components/`
5. Check API routes in `src/pages/api/`

---

**Ready to go? Start the server with `npm run dev`!**
