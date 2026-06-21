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
    })

    // Natural sort: extract numeric part from tag for proper ordering
    // e.g., "GPS6/1/ups" < "GPS6/2/ups" < "GPS6/10/ups"
    inventory.sort((a, b) => {
      const tagA = a.itemTag || ''
      const tagB = b.itemTag || ''
      if (!tagA && !tagB) return a.itemName.localeCompare(b.itemName)
      if (!tagA) return 1
      if (!tagB) return -1

      const partsA = tagA.split('/')
      const partsB = tagB.split('/')

      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const pA = partsA[i] || ''
        const pB = partsB[i] || ''
        const numA = parseInt(pA)
        const numB = parseInt(pB)

        // If both parts are numeric, compare numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB
        } else {
          const cmp = pA.localeCompare(pB)
          if (cmp !== 0) return cmp
        }
      }
      return 0
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
