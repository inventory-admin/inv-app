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
          troubleshootingDone: data.troubleshootingDone || false,
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

const VALID_ACTIONS = ['resolve', 'discard_replace', 'discard'] as const
type IssueAction = (typeof VALID_ACTIONS)[number]

export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { issueId, action } = data as { issueId: number; action: string; location?: string }

    // Validate action field
    if (!VALID_ACTIONS.includes(action as IssueAction)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be resolve, discard_replace, or discard' },
        { status: 400 }
      )
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { inventory: true },
    })

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    if (action === 'resolve') {
      const result = await prisma.$transaction(async (tx) => {
        // Check tag uniqueness before setting condition to WORKING
        if (issue.inventory.itemTag) {
          const conflicting = await tx.inventory.findFirst({
            where: {
              itemTag: issue.inventory.itemTag,
              condition: 'WORKING',
              id: { not: issue.inventory.id },
            },
          })
          if (conflicting) {
            return { conflict: true, tag: issue.inventory.itemTag }
          }
        }

        const updatedIssue = await tx.issue.update({
          where: { id: issueId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
          },
        })

        await tx.inventory.update({
          where: { id: issue.inventory.id },
          data: { condition: 'WORKING' },
        })

        return { conflict: false, issue: updatedIssue }
      })

      if (result.conflict) {
        return NextResponse.json(
          { error: `Another WORKING item with tag '${result.tag}' already exists` },
          { status: 409 }
        )
      }

      return NextResponse.json({ issue: result.issue })
    }

    if (action === 'discard_replace') {
      const newLocation = data.location || 'IN_OFFICE'
      const newItemTag = data.newItemTag !== undefined ? data.newItemTag : issue.inventory.itemTag

      const result = await prisma.$transaction(async (tx) => {
        // Check tag uniqueness before creating new WORKING item
        if (newItemTag) {
          const conflicting = await tx.inventory.findFirst({
            where: {
              itemTag: newItemTag,
              condition: 'WORKING',
              id: { not: issue.inventory.id },
            },
          })
          if (conflicting) {
            return { conflict: true, tag: newItemTag }
          }
        }

        // Discard old item
        await tx.inventory.update({
          where: { id: issue.inventory.id },
          data: { condition: 'DISCARDED', location: 'DISCARDED' },
        })

        // Create replacement item with the provided or original tag
        const newItem = await tx.inventory.create({
          data: {
            itemTag: newItemTag || null,
            itemName: issue.inventory.itemName,
            category: issue.inventory.category,
            schoolId: issue.inventory.schoolId,
            condition: 'WORKING',
            location: newLocation,
            quantity: 1,
            lastModifiedBy: 'system',
          },
        })

        // Close the issue
        const updatedIssue = await tx.issue.update({
          where: { id: issueId },
          data: {
            status: 'CLOSED',
            resolvedAt: new Date(),
          },
        })

        return { conflict: false, issue: updatedIssue, newItem }
      })

      if (result.conflict) {
        return NextResponse.json(
          { error: `Another WORKING item with tag '${result.tag}' already exists` },
          { status: 409 }
        )
      }

      return NextResponse.json({ issue: result.issue, newItem: result.newItem })
    }

    // action === 'discard'
    const discardResult = await prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { id: issue.inventory.id },
        data: { condition: 'DISCARDED', location: 'DISCARDED' },
      })

      const updatedIssue = await tx.issue.update({
        where: { id: issueId },
        data: {
          status: 'CLOSED',
          resolvedAt: new Date(),
        },
      })

      return { issue: updatedIssue }
    })

    return NextResponse.json({ issue: discardResult.issue })
  } catch (error) {
    console.error('Error updating issue:', error)
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    )
  }
}
