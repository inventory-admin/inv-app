import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create schools
  const schools = await prisma.school.createMany({
    data: [
      { name: 'Office' },
      { name: 'GPS Soffi Pind' },
      { name: 'GPS Dhina' },
      { name: 'GPS Lohar Sukha Singh' },
      { name: 'GPS Tajpur' },
      { name: 'Khurla- Kingra' },
      { name: 'Olympian Mandeep Singh GPS Mithapur' },
      { name: 'GPS Dhilwan' },
      { name: 'GPS Khusropur' },
    ],
  })

  // Fetch created schools to get IDs
  const office = await prisma.school.findUnique({ where: { name: 'Office' } })
  const soffiPind = await prisma.school.findUnique({ where: { name: 'GPS Soffi Pind' } })
  const dhina = await prisma.school.findUnique({ where: { name: 'GPS Dhina' } })
  const loharSukha = await prisma.school.findUnique({ where: { name: 'GPS Lohar Sukha Singh' } })
  const tajpur = await prisma.school.findUnique({ where: { name: 'GPS Tajpur' } })
  const khurla = await prisma.school.findUnique({ where: { name: 'Khurla- Kingra' } })
  const mithapur = await prisma.school.findUnique({ where: { name: 'Olympian Mandeep Singh GPS Mithapur' } })
  const dhilwan = await prisma.school.findUnique({ where: { name: 'GPS Dhilwan' } })
  const khusropur = await prisma.school.findUnique({ where: { name: 'GPS Khusropur' } })

  // Create inventory items
  await prisma.inventory.createMany({
    data: [
      {
        itemName: 'Wireless Mouse',
        category: 'MOUSE',
        location: 'AT_SCHOOL',
        condition: 'WORKING',
        quantity: 30,
        minStockLevel: 10,
        schoolId: mithapur?.id,
        notes: 'Wireless',
        lastModifiedBy: 'admin@ngo.org',
      },
      {
        itemName: 'Mechanical Keyboard',
        category: 'KEYBOARD',
        location: 'AT_SCHOOL',
        condition: 'WORKING',
        quantity: 25,
        minStockLevel: 8,
        schoolId: tajpur?.id,
        notes: 'Mechanical',
        lastModifiedBy: 'admin@ngo.org',
      },
      {
        itemName: 'Desktop CPU',
        category: 'CPU',
        location: 'AT_SCHOOL',
        condition: 'WORKING',
        quantity: 12,
        minStockLevel: 4,
        schoolId: dhilwan?.id,
        notes: 'With SSD',
        lastModifiedBy: 'admin@ngo.org',
      },
      {
        itemName: 'UPS Battery Backup',
        category: 'UPS',
        location: 'AT_SCHOOL',
        condition: 'DAMAGED',
        quantity: 6,
        minStockLevel: 2,
        schoolId: khusropur?.id,
        notes: 'Needs battery replacement',
        lastModifiedBy: 'admin@ngo.org',
      },
      {
        itemName: 'Monitor Cables',
        category: 'SCREEN',
        location: 'AT_SCHOOL',
        condition: 'WORKING',
        quantity: 50,
        minStockLevel: 15,
        schoolId: khurla?.id,
        notes: 'Assorted types',
        lastModifiedBy: 'admin@ngo.org',
      },
      {
        itemName: 'LED Monitor',
        category: 'SCREEN',
        location: 'AT_SCHOOL',
        condition: 'WORKING',
        quantity: 18,
        minStockLevel: 5,
        schoolId: soffiPind?.id,
        notes: 'Monitor LEDs',
        lastModifiedBy: 'admin@ngo.org',
      },
      {
        itemName: 'LED Monitor',
        category: 'SCREEN',
        location: 'AT_SCHOOL',
        condition: 'WORKING',
        quantity: 18,
        minStockLevel: 5,
        notes: 'Monitor LEDs',
        lastModifiedBy: 'admin@ngo.org',
      },
      {
        itemName: 'Desktop CPU',
        category: 'CPU',
        location: 'IN_OFFICE',
        condition: 'WORKING',
        quantity: 1,
        schoolId: office?.id,
        notes: 'New installed',
        lastModifiedBy: 'admin@ngo.org',
      },
    ],
  })

  console.log('✅ Seed data created successfully')
  console.log('📊 9 schools and 8 inventory items created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
