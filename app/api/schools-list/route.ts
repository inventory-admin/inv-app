import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      include: {
        inventory: {
          select: {
            condition: true,
            location: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(schools)
  } catch (error) {
    console.error('Error fetching schools list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    )
  }
}
