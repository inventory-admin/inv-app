import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isValidCombo } from '@/lib/inventory-status'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { itemIds } = data
    let { location, condition } = data as { location?: string; condition?: string }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'No items selected' },
        { status: 400 }
      )
    }

    // Discarded is terminal: if either field is set to DISCARDED in a bulk update,
    // force both so we never produce an invalid combo.
    if (location === 'DISCARDED' || condition === 'DISCARDED') {
      location = 'DISCARDED'
      condition = 'DISCARDED'
    }

    // Validate the resulting combination against the existing state of each item.
    // We must block the update if it would leave any selected item in an invalid state.
    const items = await prisma.inventory.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, location: true, condition: true },
    })

    for (const item of items) {
      const finalLocation = location || item.location
      const finalCondition = condition || item.condition
      if (!isValidCombo(finalLocation, finalCondition)) {
        return NextResponse.json(
          {
            error: `Update blocked: item ${item.id} would become ${finalLocation} + ${finalCondition}, which is not a valid combination. Set both Location and Condition explicitly.`,
          },
          { status: 400 }
        )
      }
    }

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
