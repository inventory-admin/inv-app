import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { itemIds, location, condition } = data

    // Build the update object with only the fields that should be updated
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (location) {
      updateData.location = location
    }

    if (condition) {
      updateData.condition = condition
    }

    // Update all items with the given IDs
    await prisma.inventory.updateMany({
      where: {
        id: {
          in: itemIds,
        },
      },
      data: updateData,
    })

    return NextResponse.json({ success: true, updated: itemIds.length })
  } catch (error) {
    console.error('Error bulk updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update inventory' },
      { status: 500 }
    )
  }
}
