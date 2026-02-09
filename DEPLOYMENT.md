# Deployment Guide - Vercel + Neon

Complete guide to deploy your NGO Inventory app to production.

---

## 🎯 What You'll Deploy

- **App:** Vercel (free hosting)
- **Database:** Neon PostgreSQL (free tier)
- **Auth:** Vercel password protection (free)
- **Total cost:** $0/month (within free tiers)

---

## 📋 Prerequisites

- GitHub account
- Vercel account (sign up with GitHub)
- Neon account (sign up with GitHub)
- Your app code pushed to GitHub

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub (5 min)

```bash
cd ~/inv-app

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - NGO Inventory MVP"

# Create repo on GitHub (via web interface)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/inv-app.git
git branch -M main
git push -u origin main
```

**Important:** Make sure `.env` is in `.gitignore` (it already is)

---

### Step 2: Create Neon Database (5 min)

1. **Go to:** https://neon.tech
2. **Sign up** with GitHub
3. **Create new project:**
   - Name: `ngo-inventory`
   - Region: Choose closest to your users
   - PostgreSQL version: 16 (latest)
4. **Copy connection string:**
   - Click "Connection string"
   - Copy the full URL (starts with `postgresql://`)
   - Example: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`

**Save this connection string!** You'll need it in Step 4.

---

### Step 3: Update Schema for PostgreSQL (2 min)

```bash
# Edit prisma/schema.prisma
# Change line 5 from:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

# To:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Commit and push:**
```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for production"
git push
```

---

### Step 4: Deploy to Vercel (5 min)

1. **Go to:** https://vercel.com
2. **Sign up** with GitHub
3. **Import project:**
   - Click "Add New" → "Project"
   - Select your `inv-app` repository
   - Click "Import"

4. **Configure environment variables:**
   - Click "Environment Variables"
   - Add variable:
     - Name: `DATABASE_URL`
     - Value: (paste Neon connection string from Step 2)
   - Click "Add"

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at: `https://inv-app-xxx.vercel.app`

---

### Step 5: Run Database Migrations (2 min)

Your database is empty! Need to create tables.

**Option A: Via Vercel CLI (recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.production
DATABASE_URL=$(cat .env.production | grep DATABASE_URL | cut -d '=' -f2-) npx prisma migrate deploy
```

**Option B: Via local terminal**

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Seed data
npm run seed
```

---

### Step 6: Add Password Protection (2 min)

1. **Go to Vercel dashboard**
2. **Select your project** → Settings
3. **Scroll to "Deployment Protection"**
4. **Enable "Password Protection"**
5. **Set password** (e.g., `ngo2024`)
6. **Save**

Now anyone visiting your app must enter the password first.

---

### Step 7: Test Your Deployment (2 min)

1. **Visit your Vercel URL:** `https://inv-app-xxx.vercel.app`
2. **Enter password** (from Step 6)
3. **Test features:**
   - View inventory list
   - Add a device
   - View schools
   - Edit a device

**If everything works:** ✅ You're live!

---

## 🔄 Updating Your App

After making changes locally:

```bash
# 1. Test locally
npm run dev

# 2. Commit changes
git add .
git commit -m "Add new feature"

# 3. Push to GitHub
git push

# 4. Vercel auto-deploys (30 seconds)
```

Vercel automatically redeploys on every push to `main` branch!

---

## 🔐 Managing Secrets

### Add New Environment Variable

```bash
# Via Vercel dashboard
1. Project → Settings → Environment Variables
2. Add new variable
3. Redeploy (or wait for next push)

# Via CLI
vercel env add DATABASE_URL production
```

### Update Existing Variable

```bash
# Via dashboard
1. Settings → Environment Variables
2. Click variable → Edit
3. Save → Redeploy

# Via CLI
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
```

---

## 📊 Monitoring

### View Logs

```bash
# Via CLI
vercel logs

# Via dashboard
Project → Deployments → Click deployment → Logs
```

### Check Database

```bash
# Via Neon dashboard
1. Go to neon.tech
2. Select project
3. Click "Tables" to view data

# Via Prisma Studio
DATABASE_URL="postgresql://..." npx prisma studio
```

---

## 🐛 Troubleshooting

### "Can't connect to database"

**Check connection string:**
```bash
# In Vercel dashboard
Settings → Environment Variables → DATABASE_URL

# Should look like:
postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
```

**Common issues:**
- Missing `?sslmode=require` at the end
- Wrong password (regenerate in Neon)
- Database paused (Neon free tier pauses after inactivity)

---

### "Table doesn't exist"

**You forgot to run migrations!**

```bash
# Connect to production DB
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Seed data
npm run seed
```

---

### "Build failed"

**Check build logs in Vercel:**
1. Deployments → Failed deployment → View logs
2. Common issues:
   - TypeScript errors
   - Missing dependencies
   - Environment variables not set

**Fix and redeploy:**
```bash
git add .
git commit -m "Fix build error"
git push
```

---

### "Password protection not working"

**Vercel password protection only works on production domain.**

Test at: `https://inv-app-xxx.vercel.app` (not preview URLs)

---

## 💰 Cost Breakdown

### Free Tier Limits

**Vercel:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Password protection
- **Cost:** $0/month

**Neon:**
- ✅ 0.5 GB storage
- ✅ 1 database
- ✅ Daily backups (7 days)
- ✅ Automatic scaling
- **Cost:** $0/month

**Total:** $0/month for typical NGO usage

### When You'll Need to Pay

**Vercel ($20/month):**
- >100 GB bandwidth
- >1000 serverless function executions/day
- Custom domains (free on Pro)

**Neon ($19/month):**
- >0.5 GB storage (~50,000 inventory items)
- >100 hours compute/month
- >30 days backup retention

**For your use case:** Free tier should last 1-2 years!

---

## 🔄 Backup Strategy

### Automatic Backups (Neon)

- Daily backups (last 7 days)
- Restore via Neon dashboard
- Point-in-time recovery (paid plans)

### Manual Backups

```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Store in Google Drive / Dropbox
# Run weekly via cron job
```

### Disaster Recovery

```bash
# 1. Create new Neon database
# 2. Get new connection string
# 3. Restore from backup
psql $NEW_DATABASE_URL < backup-20260111.sql

# 4. Update Vercel env var
vercel env add DATABASE_URL production
# (paste new connection string)

# 5. Redeploy
vercel --prod
```

---

## 📱 Custom Domain (Optional)

### Add Your Own Domain

1. **Buy domain** (e.g., inventory.ngo.org)
2. **In Vercel:**
   - Settings → Domains
   - Add domain
   - Follow DNS instructions
3. **Wait 24-48 hours** for DNS propagation
4. **Done!** Auto HTTPS included

**Cost:** ~$10-15/year for domain

---

## 🎯 Post-Deployment Checklist

- [ ] App loads at Vercel URL
- [ ] Password protection works
- [ ] Can view inventory list
- [ ] Can add new device
- [ ] Can edit device
- [ ] Can view schools
- [ ] Database persists data (refresh page)
- [ ] Shared Vercel URL with team
- [ ] Documented password somewhere safe
- [ ] Set up weekly database backups

---

## 📞 Support

**Vercel Issues:**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**Neon Issues:**
- Docs: https://neon.tech/docs
- Discord: https://discord.gg/neon

**App Issues:**
- Check logs: `vercel logs`
- Check database: Neon dashboard
- Check code: GitHub repository

---

## 🚀 You're Live!

Your NGO Inventory app is now:
- ✅ Deployed to production
- ✅ Accessible from anywhere
- ✅ Password protected
- ✅ Backed up daily
- ✅ Auto-deploys on push
- ✅ Free (within limits)

**Share with your team:** `https://inv-app-xxx.vercel.app`

**Password:** (the one you set in Step 6)

---

**Next steps:** Add more features, customize for your needs, or just use it as-is!
