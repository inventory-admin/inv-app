# The Only README

## Setup (One Time)

```bash
npm run dev:setup    # Starts Docker PostgreSQL + runs migrations + seeds data
```

## Daily Development

```bash
npm run dev          # Start Next.js (PostgreSQL runs in Docker)
```

## Database Commands

```bash
npm run db:up        # Start PostgreSQL container
npm run db:down      # Stop PostgreSQL container
npm run db:setup     # Run migrations + seed data
npm run db:reset     # Reset database + seed data
```

## Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Apply changes
npx prisma migrate dev --name your_change_name
```

## Production

- Uses same PostgreSQL schema as local
- No environment switching needed
- Deploy with standard Next.js deployment

## Cache Configuration

**Dashboard update delay**: 10 seconds (configurable)

To change cache delay, edit `CACHE_SECONDS = 10` in:
- `app/api/schools-list/route.ts`
- `app/api/inventory-list/route.ts`
- `app/dashboards/*/page.tsx`

## Code Generation

**Item codes**: Auto-generated with format `INV-{timestamp}-{random}`  
**School codes**: Manual input required  
**Item tags**: Auto-generated for school onboarding: `{schoolId}/{inventoryId}/{itemType}`
