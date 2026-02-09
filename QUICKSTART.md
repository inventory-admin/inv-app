# Quick Start

The MVP is ready to run!

## Start the App

```bash
cd ~/inv-app
npm run dev
```

Open http://localhost:3000 in your browser.

## What's Included

✅ **3 Schools** (Lincoln Elementary, Washington High, Roosevelt Middle)
✅ **7 Sample Devices** (laptops, desktops, tablets)
✅ **All CRUD Operations** (create, read, update, delete)
✅ **All 7 Workflows** from the plan

## Pages to Test

1. **Home** - http://localhost:3000
2. **Inventory List** - http://localhost:3000/inventory
3. **Add Device** - http://localhost:3000/inventory/new
4. **Schools List** - http://localhost:3000/schools
5. **Add School** - http://localhost:3000/schools/new

## Try These Workflows

### 1. Add a New Device
- Go to Inventory → Add Device
- Fill in: "MacBook Pro", "Laptop"
- Leave location as "In Office"
- Enter your email
- Submit

### 2. Assign Device to School
- Click any device with location "In Office"
- Change location to "At School"
- Select a school
- Save

### 3. Report Broken Device
- Click any device at a school
- Uncheck "Device is working"
- Add notes: "Screen broken"
- Save

### 4. View School Status
- Go to Schools
- Click any school name
- See all devices with working/broken status

## Tech Stack

- Next.js 14 (compatible with Node 18)
- React 18
- Prisma + SQLite
- Tailwind CSS
- TypeScript

## Files Created

```
inv-app/
├── app/
│   ├── inventory/          # Device management
│   ├── schools/            # School management
│   └── page.tsx            # Home page
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Sample data
│   └── dev.db              # SQLite database
└── lib/
    └── prisma.ts           # Database client
```

## Next Steps

To deploy to production:
1. Push to GitHub
2. Deploy to Vercel
3. Switch to PostgreSQL (Neon)
4. Add password protection

See README.md for full documentation.
