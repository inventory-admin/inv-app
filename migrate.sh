#!/bin/bash
# Populate itemId for existing rows, then make it required

# Step 1: Add optional itemId column
npx prisma migrate dev --name add_item_id_optional --skip-seed

# Step 2: Populate existing rows with unique itemIds
npx prisma db execute --stdin <<SQL
UPDATE Inventory 
SET itemId = 'INV-' || id || '-' || substr(hex(randomblob(3)), 1, 6)
WHERE itemId IS NULL;
SQL

# Step 3: Update schema to make itemId required
sed -i 's/itemId         String?/itemId         String/' prisma/schema.prisma

# Step 4: Apply final migration
npx prisma migrate dev --name make_item_id_required --skip-seed
