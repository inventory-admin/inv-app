import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const inventory = await prisma.inventory.create({
      data: {
        itemName: data.itemName,
        category: data.category,
        quantity: data.quantity,
        condition: data.condition,
        location: data.location,
        itemTag: data.itemTag || null,
        notes: data.notes || null,
        lastModifiedBy: data.lastModifiedBy,
      },
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}
