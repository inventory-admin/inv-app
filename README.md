# NGO Inventory Management App

Simple inventory tracking system for managing devices across schools.

## Quick Start

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed sample data
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Features

- ✅ Add/edit devices (laptops, desktops, tablets, etc.)
- ✅ Track device location (office, school, discarded)
- ✅ Mark devices as working/broken
- ✅ Assign devices to schools
- ✅ View school-level summaries
- ✅ Simple audit trail (lastModifiedBy + updatedAt)

## Workflows

### 1. Receive New Device
1. Go to Inventory → Add Device
2. Fill in item name, category
3. Leave location as "In Office"
4. Submit

### 2. Assign to School
1. Find device in inventory
2. Click Edit
3. Change location to "At School"
4. Select school
5. Save

### 3. Report Broken Device
1. Find device
2. Click Edit
3. Uncheck "Device is working"
4. Add notes about the issue
5. Save

### 4. Bring Back for Repair
1. Find broken device at school
2. Click Edit
3. Change location to "In Office"
4. Clear school assignment
5. Save

### 5. Mark as Fixed
1. Find device in office (not working)
2. Click Edit
3. Check "Device is working"
4. Update notes
5. Save

### 6. Discard Device
1. Find device
2. Click Edit
3. Change location to "Discarded"
4. Save

## Database Schema

### Inventory
- id (int, auto-increment)
- itemName (string)
- category (string)
- location (enum: IN_OFFICE, AT_SCHOOL, DISCARDED)
- isWorking (boolean)
- schoolId (int, nullable)
- notes (text, nullable)
- lastModifiedBy (email string)
- createdAt, updatedAt

### School
- id (int, auto-increment)
- name (string, unique)
- createdAt

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma** (ORM)
- **SQLite** (local dev) / **PostgreSQL** (production)
- **Tailwind CSS**

## Deployment

### Vercel + Neon (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Create Neon database
4. Add `DATABASE_URL` env var in Vercel
5. Deploy

### Environment Variables

```
DATABASE_URL="postgresql://..."  # For production
```

## Adding Features

### Add a Field

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field`
3. Update forms in `app/inventory/new/page.tsx` and `app/inventory/[id]/page.tsx`

### Add Enum Value

1. Update enum in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name update_enum`
3. Update UI dropdowns

## Known Limitations

- No multi-user auth (add Vercel password protection)
- No detailed audit trail (just lastModifiedBy + updatedAt)
- No issue tracking (just isWorking boolean + notes)
- School stats computed on-demand (fine for <1000 devices)

## Future Enhancements (Not in MVP)

- Transaction history table
- Issue tracking with components
- Dashboard with charts
- CSV export
- Filters and search
- Email notifications

## License

Internal NGO tool - not for public distribution
