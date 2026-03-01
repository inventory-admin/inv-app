import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Condition } from '@prisma/client'

// Map issue type to inventory condition
const issueTypeToCondition: Record<string, Condition> = {
  HARDWARE_FAILURE: 'NOT_WORKING',
  SOFTWARE_ISSUE: 'NOT_WORKING',
  PHYSICAL_DAMAGE: 'NOT_WORKING',
  MISSING: 'DISCARDED',
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const newCondition = issueTypeToCondition[data.issueType]

    // Create issue and update inventory condition in a transaction
    const [issue] = await prisma.$transaction([
      prisma.issue.create({
        data: {
          inventoryId: data.inventoryId,
          schoolId: data.schoolId,
          issueType: data.issueType,
          description: data.description,
          reportedBy: data.reportedBy,
        },
      }),
      ...(newCondition ? [prisma.inventory.update({
        where: { id: data.inventoryId },
        data: { condition: newCondition },
      })] : []),
    ])

    return NextResponse.json(issue, { status: 201 })
  } catch (error) {
    console.error('Error creating issue:', error)
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { issueId, status } = data

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const isResolving = status === 'RESOLVED' || status === 'CLOSED'

    // Update issue and sync inventory condition in a transaction
    const [updatedIssue] = await prisma.$transaction([
      prisma.issue.update({
        where: { id: issueId },
        data: {
          status,
          ...(isResolving ? { resolvedAt: new Date() } : {}),
        },
      }),
      ...(isResolving ? [prisma.inventory.update({
        where: { id: issue.inventoryId },
        data: { condition: 'WORKING' as Condition },
      })] : []),
    ])

    return NextResponse.json(updatedIssue)
  } catch (error) {
    console.error('Error updating issue:', error)
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    )
  }
}
