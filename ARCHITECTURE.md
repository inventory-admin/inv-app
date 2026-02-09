# Project Structure Guide

Complete guide to understanding the NGO Inventory Management app architecture.

---

## 📁 Directory Overview

```
inv-app/
├── app/              # Next.js App Router (all pages & routes)
├── lib/              # Shared utilities
├── prisma/           # Database schema & migrations
├── public/           # Static files (images, fonts)
├── node_modules/     # Dependencies (auto-generated)
├── .next/            # Build output (auto-generated)
├── package.json      # Dependencies & scripts
├── tsconfig.json     # TypeScript config
└── next.config.mjs   # Next.js config
```

---

## 🗂️ App Directory (Routes & Pages)

The `app/` folder uses **file-system based routing**. Each folder becomes a URL route.

```
app/
├── page.tsx                    # Home page (/)
├── layout.tsx                  # Root layout (wraps all pages)
├── globals.css                 # Global Tailwind styles
│
├── inventory/                  # /inventory route
│   ├── page.tsx               # List all devices (/inventory)
│   ├── actions.ts             # Server actions (create, update, delete)
│   ├── new/
│   │   └── page.tsx           # Add device form (/inventory/new)
│   └── [id]/
│       └── page.tsx           # Edit device (/inventory/123)
│
└── schools/                    # /schools route
    ├── page.tsx               # List all schools (/schools)
    ├── actions.ts             # Server actions (create, update)
    ├── new/
    │   └── page.tsx           # Add school form (/schools/new)
    └── [id]/
        └── page.tsx           # School detail (/schools/5)
```

### File Naming Conventions

| File Name       | Purpose                          | URL Example              |
|-----------------|----------------------------------|--------------------------|
| `page.tsx`      | Renders the page UI              | `/inventory`             |
| `layout.tsx`    | Wraps child pages                | Shared header/footer     |
| `actions.ts`    | Server-side functions            | Database operations      |
| `[id]`          | Dynamic route segment            | `/inventory/123`         |
| `loading.tsx`   | Loading UI (optional)            | Skeleton while fetching  |
| `error.tsx`     | Error boundary (optional)        | Error handling           |

---

## 🔄 How Routing Works

### Static Routes
```
app/inventory/page.tsx       →  /inventory
app/schools/new/page.tsx     →  /schools/new
```

### Dynamic Routes
```
app/inventory/[id]/page.tsx  →  /inventory/1, /inventory/2, etc.
app/schools/[id]/page.tsx    →  /schools/1, /schools/2, etc.
```

The `[id]` folder creates a dynamic segment. Access it via `params.id`:

```tsx
export default async function EditPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)  // "123" → 123
  // ...
}
```

---

## 📄 Key Files Explained

### 1. `app/layout.tsx` - Root Layout

Wraps every page in the app. Contains `<html>`, `<body>`, and global elements.

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* All pages render here */}
        {children}
      </body>
    </html>
  )
}
```

**When to edit:**
- Add global navigation
- Add site-wide header/footer
- Change page title/metadata

---

### 2. `app/inventory/page.tsx` - List Page

Server Component that fetches and displays all devices.

```tsx
import { prisma } from '@/lib/prisma'

export default async function InventoryPage() {
  // ✅ Runs on SERVER, not browser
  const items = await prisma.inventory.findMany({
    include: { school: true },
  })
  
  return (
    <table>
      {items.map(item => <tr>...</tr>)}
    </table>
  )
}
```

**Key points:**
- `async` function = can query database directly
- No `useState`, no `useEffect` needed
- Runs on server, sends HTML to browser

---

### 3. `app/inventory/actions.ts` - Server Actions

Functions that run on the server when forms are submitted.

```tsx
'use server'  // ← Marks this file as server-only

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createInventory(formData: FormData) {
  const itemName = formData.get('itemName') as string
  
  await prisma.inventory.create({
    data: { itemName, ... }
  })
  
  redirect('/inventory')  // Navigate after save
}
```

**Key points:**
- `'use server'` = these functions never run in browser
- Called directly from forms: `<form action={createInventory}>`
- No API routes needed

---

### 4. `app/inventory/new/page.tsx` - Form Page

```tsx
import { createInventory } from '../actions'

export default function NewInventoryPage() {
  return (
    <form action={createInventory}>
      <input name="itemName" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

**Key points:**
- Form calls server action directly
- No JavaScript needed for basic functionality
- Progressive enhancement (works without JS)

---

## 🗄️ Database Layer (Prisma)

```
prisma/
├── schema.prisma              # Database schema (source of truth)
├── seed.ts                    # Sample data script
├── dev.db                     # SQLite database file
└── migrations/                # Version-controlled schema changes
    ├── 20260111171348_init/
    │   └── migration.sql
    └── 20260111175418_add_fields/
        └── migration.sql
```

### `prisma/schema.prisma` - Database Schema

Defines tables, fields, and relationships.

```prisma
model Inventory {
  id       Int     @id @default(autoincrement())
  itemName String
  quantity Int     @default(1)
  schoolId Int?
  school   School? @relation(fields: [schoolId], references: [id])
}

model School {
  id        Int         @id @default(autoincrement())
  name      String      @unique
  inventory Inventory[]  // ← One school has many items
}
```

**Key concepts:**
- `@id` = primary key
- `@default(autoincrement())` = auto-increment ID
- `@unique` = no duplicates allowed
- `?` = nullable field
- Relations defined with `@relation`

---

### Database Workflow

```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_field

# 3. Regenerate client (if needed)
npx prisma generate

# 4. Seed data (optional)
npm run seed
```

---

## 🔗 How Data Flows

### Example: User Edits a Device

```
1. User clicks "Edit" on device #5
         ↓
2. Browser navigates to /inventory/5
         ↓
3. app/inventory/[id]/page.tsx runs on SERVER
         ↓
4. Fetches device from database:
   const item = await prisma.inventory.findUnique({ where: { id: 5 } })
         ↓
5. Renders HTML form with current values
         ↓
6. User changes "quantity" to 50 and submits
         ↓
7. Form calls updateInventory() server action
         ↓
8. app/inventory/actions.ts updates database:
   await prisma.inventory.update({ where: { id: 5 }, data: { quantity: 50 } })
         ↓
9. Redirects back to /inventory
         ↓
10. List page shows updated data
```

**No API routes, no fetch(), no client state!**

---

## 🧩 Shared Code

### `lib/prisma.ts` - Database Client

Singleton pattern to prevent multiple connections in development.

```tsx
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Usage:**
```tsx
import { prisma } from '@/lib/prisma'

const items = await prisma.inventory.findMany()
```

---

## 🎯 Architecture Principles

### 1. Server Components (Default)

All pages are Server Components unless marked `'use client'`.

**Benefits:**
- Direct database access
- No JavaScript sent to browser
- Faster page loads
- Better SEO

**When to use Client Components:**
- Interactive UI (dropdowns, modals)
- Browser APIs (localStorage, geolocation)
- React hooks (useState, useEffect)

### 2. Server Actions

Form submissions call server functions directly.

**Benefits:**
- Type-safe (TypeScript end-to-end)
- No fetch() boilerplate
- Automatic revalidation
- Progressive enhancement

### 3. File-System Routing

Folder structure = URL structure.

**Benefits:**
- Intuitive organization
- No route config files
- Easy to find code
- Automatic code splitting

---

## 📝 Common Tasks

### Add a New Page

```bash
# 1. Create folder and file
mkdir -p app/reports
touch app/reports/page.tsx

# 2. Add component
echo 'export default function ReportsPage() {
  return <div>Reports</div>
}' > app/reports/page.tsx

# 3. Visit /reports
```

### Add a Database Field

```bash
# 1. Edit schema
# Add field to prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_field

# 3. Update forms
# Add input field to new/page.tsx and [id]/page.tsx

# 4. Update actions
# Add field to createInventory() and updateInventory()
```

### Add Sample Data

```bash
# 1. Edit seed file
vim prisma/seed.ts

# 2. Run seed
npm run seed
```

### Reset Database

```bash
# Delete all data and reseed
npx prisma migrate reset --force
```

---

## 🔍 Debugging Tips

### Check Server Logs

Server Components and Server Actions log to terminal, not browser console.

```tsx
export default async function Page() {
  console.log('This appears in TERMINAL')  // ← Server
  return <div>Page</div>
}
```

### Check Database

```bash
# Open Prisma Studio (visual DB editor)
npx prisma studio

# Or use SQLite CLI
sqlite3 prisma/dev.db "SELECT * FROM Inventory;"
```

### Clear Cache

```bash
# If pages aren't updating
rm -rf .next
npm run dev
```

---

## 🚀 Deployment Checklist

1. **Switch to PostgreSQL**
   - Update `prisma/schema.prisma`: `provider = "postgresql"`
   - Update `.env`: `DATABASE_URL="postgresql://..."`

2. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

3. **Deploy to Vercel**
   - Push to GitHub
   - Import to Vercel
   - Add `DATABASE_URL` env var
   - Deploy

4. **Add password protection**
   - Vercel dashboard → Settings → Password Protection

---

## 💡 Why This Structure?

**Simple & Scalable:**
- Each feature (inventory, schools) is self-contained
- Easy to find related code (page + actions in same folder)
- Database schema is version-controlled
- No complex state management

**Easy Handover:**
- Clear folder structure
- Minimal abstractions
- Standard Next.js patterns
- Well-documented schema

**Maintainable:**
- Server-first (less JavaScript)
- Type-safe (TypeScript + Prisma)
- Progressive enhancement
- Boring technology choices

---

## 📚 Further Reading

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [Server Actions Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [File-based Routing](https://nextjs.org/docs/app/building-your-application/routing)

---

**This is a boring, maintainable architecture—exactly what you want for an internal tool!**
