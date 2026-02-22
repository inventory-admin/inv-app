import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Cache configuration - Change this to adjust dashboard update delay
const CACHE_SECONDS = 10

export const dynamic = 'force-dynamic'
export const revalidate = CACHE_SECONDS

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { itemName: 'asc' },
    })

    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Error fetching inventory list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
