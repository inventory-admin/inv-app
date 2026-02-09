import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const items = await prisma.inventory.findMany({
    where: { itemId: null }
  })

  console.log(`Found ${items.length} items without itemId`)

  for (const item of items) {
    const itemId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    await prisma.inventory.update({
      where: { id: item.id },
      data: { itemId }
    })
    console.log(`Updated item ${item.id} with itemId: ${itemId}`)
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
