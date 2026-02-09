import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { school, devices } = data

    // Create the school first
    const createdSchool = await prisma.school.create({
      data: {
        schoolId: school.schoolId,
        name: school.name,
      },
    })

    // If devices were provided, create them with auto-generated tags
    const createdDevices = []
    
    if (devices && devices.length > 0) {
      for (const device of devices) {
        // Create inventory items based on quantity
        for (let i = 1; i <= device.quantity; i++) {
          // Use itemType as both itemName and category
          const itemType = device.itemType
          
          const inventoryItem = await prisma.inventory.create({
            data: {
              itemName: itemType,
              category: itemType,
              quantity: 1, // Each item is created separately
              condition: 'WORKING', // All new devices are working
              location: 'AT_SCHOOL',
              schoolId: createdSchool.id,
              lastModifiedBy: 'Admin',
              notes: `Auto-generated during school onboarding`,
            },
          })

          // Update with auto-generated tag after we have the ID
          const itemTag = `${createdSchool.schoolId}/${inventoryItem.id}/${itemType.toLowerCase()}`
          await prisma.inventory.update({
            where: { id: inventoryItem.id },
            data: { itemTag },
          })
          
          createdDevices.push({
            id: inventoryItem.id,
            itemName: itemType,
            itemTag: itemTag,
          })
        }
      }
    }

    return NextResponse.json({ 
      school: createdSchool, 
      devices: createdDevices 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating school:', error)
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    )
  }
}
