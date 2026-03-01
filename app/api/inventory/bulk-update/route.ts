import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

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
    const result = await prisma.inventory.updateMany({
      where: {
        id: {
          in: itemIds,
        },
      },
      data: updateData,
    })

    // Revalidate essential pages only
    revalidatePath('/inventory')
    revalidatePath('/schools')

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('Error bulk updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update inventory' },
      { status: 500 }
    )
  }
}
