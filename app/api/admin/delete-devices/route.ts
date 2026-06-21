import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { itemIds } = data

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'No items selected' },
        { status: 400 }
      )
    }

    // Delete related issues first (foreign key constraint)
    await prisma.issue.deleteMany({
      where: { inventoryId: { in: itemIds } },
    })

    // Then delete the inventory items
    const result = await prisma.inventory.deleteMany({
      where: { id: { in: itemIds } },
    })

    revalidatePath('/inventory')
    revalidatePath('/schools')
    revalidatePath('/issues')

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('Error deleting devices:', error)
    return NextResponse.json(
      { error: 'Failed to delete devices' },
      { status: 500 }
    )
  }
}
