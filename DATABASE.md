# Database Setup Guide

Understanding where your data is stored and how to manage it.

---

## 🗄️ Current Setup: SQLite (Local File)

**Location:** `prisma/dev.db`

Your database is currently a **single file** stored locally on your machine. No cloud hosting, no credentials needed.

### How It Works

```
.env file:
DATABASE_URL="file:./dev.db"
              ↓
         Points to local file
              ↓
    prisma/dev.db (32 KB file)
```

**Pros:**
- ✅ Zero setup (no account needed)
- ✅ No internet required
- ✅ Fast (local access)
- ✅ Easy backup (just copy the file)
- ✅ Free forever

**Cons:**
- ❌ Single machine only (can't share)
- ❌ No concurrent users (file locks)
- ❌ Lost if machine crashes (unless backed up)
- ❌ Can't deploy to Vercel/cloud (needs hosted DB)

---

## 📍 Where Is Your Data?

```bash
# View database file
ls -lh prisma/dev.db
# Output: -rw-r--r-- 1 user group 32K Jan 11 17:57 prisma/dev.db

# Check what's inside
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Inventory;"
# Output: 8

# Backup your data
cp prisma/dev.db prisma/dev.db.backup
```

**Your data is in:** `/home/kochhk/inv/inv-app/prisma/dev.db`

---

## 🔐 Credentials? Not Needed (Yet)

### Current Setup (SQLite)
```env
# .env file
DATABASE_URL="file:./dev.db"
```

No username, no password, no host. Just a file path.

### Future Setup (PostgreSQL for Production)
```env
# .env file
DATABASE_URL="postgresql://username:password@host:5432/database"
                          ↑        ↑        ↑     ↑      ↑
                       username password  host  port  database
```

**When you deploy to production, you'll need:**
- Database host (e.g., Neon, Supabase, AWS RDS)
- Username & password
- Connection string

---

## 🚀 Migration Path: Local → Production

### Option 1: Neon (Recommended)

**Free tier:** 0.5 GB storage, 1 database

```bash
# 1. Create account at neon.tech
# 2. Create database
# 3. Copy connection string

# 4. Update .env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# 5. Update schema
# Change in prisma/schema.prisma:
datasource db {
  provider = "postgresql"  # was "sqlite"
  url      = env("DATABASE_URL")
}

# 6. Run migrations
npx prisma migrate deploy

# 7. Seed data
npm run seed
```

**Cost:** Free for small projects, ~$5/month when you exceed limits

---

### Option 2: Supabase

**Free tier:** 500 MB storage, 2 databases

```bash
# 1. Create account at supabase.com
# 2. Create project
# 3. Go to Settings → Database → Connection string

# 4. Update .env
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"

# 5-7. Same as Neon
```

**Cost:** Free for small projects, $25/month for Pro

---

### Option 3: Railway

**Free tier:** $5 credit/month

```bash
# 1. Create account at railway.app
# 2. New Project → Add PostgreSQL
# 3. Copy DATABASE_URL from variables

# 4-7. Same as above
```

**Cost:** Pay-as-you-go after free credit

---

## 📦 Backing Up Your Data

### SQLite (Current)

**Manual backup:**
```bash
# Copy the file
cp prisma/dev.db backups/dev-$(date +%Y%m%d).db

# Or export to SQL
sqlite3 prisma/dev.db .dump > backup.sql
```

**Restore:**
```bash
# From file
cp backups/dev-20260111.db prisma/dev.db

# From SQL
sqlite3 prisma/dev.db < backup.sql
```

---

### PostgreSQL (Production)

**Automatic backups:**
- Neon: Daily backups (7 days retention on free tier)
- Supabase: Daily backups (7 days retention on free tier)
- Railway: Point-in-time recovery (paid plans)

**Manual backup:**
```bash
# Export entire database
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## 🔄 Migrating Data: SQLite → PostgreSQL

When you're ready to move to production:

```bash
# 1. Export from SQLite
sqlite3 prisma/dev.db .dump > data.sql

# 2. Clean up SQLite-specific syntax
# Remove: BEGIN TRANSACTION, COMMIT, PRAGMA statements
# Fix: AUTOINCREMENT → SERIAL

# 3. Import to PostgreSQL
psql $DATABASE_URL < data.sql

# OR use Prisma's built-in migration
npx prisma db push
```

**Easier method:** Use Prisma Studio

```bash
# 1. Open SQLite database
DATABASE_URL="file:./dev.db" npx prisma studio

# 2. Export data (copy to clipboard)

# 3. Switch to PostgreSQL
DATABASE_URL="postgresql://..." npx prisma studio

# 4. Import data (paste from clipboard)
```

---

## 🔒 Security Best Practices

### Development (SQLite)
- ✅ `.env` is in `.gitignore` (don't commit)
- ✅ `dev.db` is in `.gitignore` (don't commit)
- ✅ Keep backups outside project folder

### Production (PostgreSQL)
- ✅ Use environment variables (never hardcode)
- ✅ Enable SSL (`?sslmode=require`)
- ✅ Rotate passwords regularly
- ✅ Use read-only users for reporting
- ✅ Enable automatic backups

---

## 📊 Database Size Estimates

**Current data:**
- 9 schools
- 8 inventory items
- Database size: ~32 KB

**Projected growth:**
- 50 schools × 100 devices = 5,000 items
- Estimated size: ~2-5 MB
- Still well within free tiers!

**When to upgrade:**
- >10,000 items: Consider paid tier
- >100 concurrent users: Need connection pooling
- >1 GB data: Optimize or upgrade

---

## 🛠️ Troubleshooting

### "Database locked" error

SQLite locks the entire file during writes.

**Solution:**
```bash
# Close all connections
pkill -f "next dev"

# Remove lock file
rm prisma/dev.db-journal

# Restart
npm run dev
```

---

### "Can't connect to database"

**Check connection string:**
```bash
# Print current DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

---

### "Migration failed"

**Reset and try again:**
```bash
# Delete database
rm prisma/dev.db

# Recreate from migrations
npx prisma migrate dev

# Reseed
npm run seed
```

---

## 🎯 Recommendation for Production

**For your NGO use case:**

1. **Start with SQLite** (current setup)
   - Perfect for development
   - Test all features locally
   - No cost, no setup

2. **Deploy with Neon** (when ready)
   - Free tier is generous
   - Easy Vercel integration
   - Automatic backups
   - No credit card required

3. **Upgrade if needed** (later)
   - Only if you exceed free tier
   - Or need advanced features

---

## 📝 Quick Reference

| Database | Location | Credentials | Backup | Cost |
|----------|----------|-------------|--------|------|
| SQLite (current) | Local file | None | Manual | Free |
| Neon | Cloud | Yes | Auto | Free → $5/mo |
| Supabase | Cloud | Yes | Auto | Free → $25/mo |
| Railway | Cloud | Yes | Auto | $5 credit/mo |

---

## 🚦 When to Switch to PostgreSQL

**Stay with SQLite if:**
- ✅ Single developer
- ✅ Local development only
- ✅ <1000 items
- ✅ No deployment needed

**Switch to PostgreSQL when:**
- ❌ Need to deploy to Vercel/cloud
- ❌ Multiple users accessing simultaneously
- ❌ Need automatic backups
- ❌ Want to access from multiple machines

---

**Current status:** You're using SQLite (local file). No credentials needed. Perfect for development!
