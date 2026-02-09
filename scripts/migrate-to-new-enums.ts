import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration to new enum values...')

  // Get all inventory items
  const items = await prisma.$queryRaw<any[]>`SELECT id, category, condition FROM Inventory`
  
  console.log(`Found ${items.length} items to migrate`)

  for (const item of items) {
    let newCategory = 'CPU' // default

    // Map old categories to new enum
    const oldCategory = item.category?.toLowerCase()
    if (oldCategory?.includes('ups')) newCategory = 'UPS'
    else if (oldCategory?.includes('keyboard')) newCategory = 'KEYBOARD'
    else if (oldCategory?.includes('mouse')) newCategory = 'MOUSE'
    else if (oldCategory?.includes('cpu') || oldCategory?.includes('computer')) newCategory = 'CPU'
    else if (oldCategory?.includes('screen') || oldCategory?.includes('monitor') || oldCategory?.includes('display')) newCategory = 'SCREEN'
    else {
      // Default mapping for unknown categories
      console.log(`Unknown category "${item.category}" for item ${item.id}, defaulting to CPU`)
      newCategory = 'CPU'
    }

    // Map old condition values to new enum
    let newCondition = 'WORKING'
    const oldCondition = item.condition?.toUpperCase()
    
    if (oldCondition === 'NEW' || oldCondition === 'GOOD' || oldCondition === 'WORKING') {
      newCondition = 'WORKING'
    } else if (oldCondition === 'DAMAGED') {
      newCondition = 'DAMAGED'
    } else if (oldCondition === 'NOT_WORKING') {
      newCondition = 'NOT_WORKING'
    } else if (oldCondition === 'DISCARDED') {
      newCondition = 'DISCARDED'
    } else {
      console.log(`Unknown condition "${item.condition}" for item ${item.id}, defaulting to WORKING`)
    }

    // Update both category and condition
    await prisma.$executeRaw`UPDATE Inventory SET category = ${newCategory}, condition = ${newCondition} WHERE id = ${item.id}`
    console.log(`Updated item ${item.id}: category=${newCategory}, condition=${newCondition}`)
  }

  console.log('Migration completed!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
