import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const issue = await prisma.issue.create({
      data: {
        inventoryId: data.inventoryId,
        schoolId: data.schoolId,
        issueType: data.issueType,
        description: data.description,
        reportedBy: data.reportedBy,
      },
    })

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}
