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
      // Track per-category counts for this school to generate sequential tags
      const categoryCounts: Record<string, number> = {}

      for (const device of devices) {
        const itemType = device.itemType

        // Initialize counter for this category if not yet tracked
        if (categoryCounts[itemType] === undefined) {
          // Count existing items of this category at this school (in case of re-onboarding)
          const existingCount = await prisma.inventory.count({
            where: {
              schoolId: createdSchool.id,
              category: itemType,
            },
          })
          categoryCounts[itemType] = existingCount
        }

        // Create inventory items based on quantity
        for (let i = 1; i <= device.quantity; i++) {
          categoryCounts[itemType]++
          const seqNum = categoryCounts[itemType]
          const itemTag = `${createdSchool.schoolId}/${seqNum}/${itemType.toLowerCase()}`

          const inventoryItem = await prisma.inventory.create({
            data: {
              itemName: itemType,
              category: itemType,
              itemTag,
              quantity: 1,
              condition: 'WORKING',
              location: 'AT_SCHOOL',
              schoolId: createdSchool.id,
              lastModifiedBy: 'Admin',
              notes: `Auto-generated during school onboarding`,
            },
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
