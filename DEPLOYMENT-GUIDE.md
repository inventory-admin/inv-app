# Deployment Guide to Cloud9 and Neon

## Overview
This guide will help you deploy the updated application from your local environment to Cloud9 and then to Neon PostgreSQL database.

## Step 1: Copy Files to Cloud9

### Files to Copy (Excluding node_modules)
You'll need to copy all files except:
- `node_modules/`
- `prisma/dev.db` (local SQLite database)
- `.next/` (build artifacts)

### Using rsync (Recommended)
```bash
# From your local machine
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='prisma/dev.db' \
  /home/kochhk/inv/inv-app/ \
  ec2-user@<YOUR-EC2-IP>:~/environment/inv-app/
```

### Using SCP
```bash
# Create tar file excluding node_modules
cd /home/kochhk/inv
tar --exclude='node_modules' --exclude='.next' --exclude='prisma/dev.db' \
  -czf inv-app-update.tar.gz inv-app/

# Copy to Cloud9
scp inv-app-update.tar.gz ec2-user@<YOUR-EC2-IP>:~/environment/

# On Cloud9, extract:
cd ~/environment
tar -xzf inv-app-update.tar.gz
```

## Step 2: Setup on Cloud9

### 1. Install Dependencies
```bash
cd ~/environment/inv-app
npm install
```

### 2. Update Environment Variables
Make sure your `.env` file points to Neon (not SQLite):
```bash
# .env should contain:
DATABASE_URL="postgresql://user:password@your-neon-host.neon.tech/dbname?sslmode=require"
```

### 3. Update Schema for PostgreSQL
The `prisma/schema.prisma` currently has:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Change to:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 3: Database Migration for Neon

### Important Schema Changes
1. **Removed `isWorking` field** - Merged into `condition` enum
2. **Updated `condition` enum** - Now: WORKING, NOT_WORKING, DAMAGED, DISCARDED
3. **Changed `category`** - Now enum: UPS, KEYBOARD, MOUSE, CPU, SCREEN
4. **Added `Issue` model** - For tracking defects and problems

### Migration Steps

#### Option A: Using Prisma Migrations (Recommended for Production)
```bash
# 1. Create migration files
npx prisma migrate dev --name major_schema_update

# 2. This will:
#    - Create migration SQL files
#    - Apply them to Neon
#    - Update Prisma Client
```

#### Option B: Direct Push (Faster, but no migration history)
```bash
npx prisma db push
```

### Data Migration Script
After schema migration, run the data migration script to convert old values:
```bash
npx tsx scripts/migrate-to-new-enums.ts
```

This script will:
- Convert old categories (Accessory, Peripheral) to new enums (CPU, SCREEN, etc.)
- Convert old conditions (NEW, GOOD) to new format (WORKING)

## Step 4: Push to GitHub from Cloud9

```bash
cd ~/environment/inv-app
git add .
git commit -m "Deploy: UX improvements and schema updates"
git push origin main
```

## Step 5: Verify Deployment

### 1. Check Database
```bash
npx prisma studio
```
Navigate to http://localhost:5555 to verify:
- Inventory table has `condition` field (not `isWorking`)
- All categories are valid enums
- Issue table exists

### 2. Test Application
```bash
npm run dev
```
Navigate to http://localhost:3000 and test:
- ✅ Landing page with dashboards
- ✅ School onboarding with auto-generated tags
- ✅ Bulk inventory updates
- ✅ Issue reporting
- ✅ All dashboards loading

## Summary of Major Changes

### New Features
- 4 Dashboards (Overview, School Health, Maintenance, Inventory Health)
- Issue tracking system
- Bulk inventory updates
- Auto-generated tags (format: schoolId/itemId/deviceType)
- Multi-step school onboarding
- Advanced filtering on all pages

### Schema Changes
- Removed `isWorking` boolean
- Updated `condition` enum to include working status
- Changed `category` to enum (5 types)
- Added `Issue` model with relationships

### Files Created
- `app/dashboards/*` - 4 dashboard pages
- `app/issues/*` - Issue management
- `app/inventory/update/*` - Bulk update page
- `app/api/*` - Multiple API routes
- `scripts/migrate-to-new-enums.ts` - Data migration

## Troubleshooting

### If you get "Value not found in enum" errors:
Run the migration script:
```bash
npx tsx scripts/migrate-to-new-enums.ts
```

### If Prisma Client is out of sync:
```bash
npx prisma generate
```

### If dependencies are missing:
```bash
npm install
