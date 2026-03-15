import fc from 'fast-check'
import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { PATCH } from '@/app/api/issues/route'

function createRequest(body: any): Request {
  return { json: async () => body } as Request
}

const CATEGORIES = ['UPS', 'KEYBOARD', 'MOUSE', 'CPU', 'SCREEN'] as const

const inventoryArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  itemId: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  itemTag: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
  itemName: fc.string({ minLength: 1, maxLength: 50 }),
  category: fc.constantFrom(...CATEGORIES),
  condition: fc.constantFrom('NOT_WORKING' as const, 'DISCARDED' as const),
  location: fc.constantFrom('IN_OFFICE' as const, 'AT_SCHOOL' as const),
  quantity: fc.integer({ min: 1, max: 100 }),
  schoolId: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
  lastModifiedBy: fc.string({ minLength: 1, maxLength: 30 }),
})

const issueArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  status: fc.constant('OPEN' as const),
  reportedAt: fc.constant(new Date('2025-01-01')),
  resolvedAt: fc.constant(null as Date | null),
  schoolId: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
})

function setupMocks(issue: any, inventory: any) {
  const fullIssue = { ...issue, inventoryId: inventory.id, inventory }
  const txCalls: Record<string, any[]> = {
    'inventory.findFirst': [],
    'inventory.update': [],
    'inventory.create': [],
    'issue.update': [],
  }

  mockPrisma.issue.findUnique.mockResolvedValue(fullIssue)
  mockPrisma.$transaction.mockImplementation(async (fn: any) => {
    const tx = {
      inventory: {
        findFirst: jest.fn().mockImplementation(async (args: any) => {
          txCalls['inventory.findFirst'].push(args)
          return null
        }),
        update: jest.fn().mockImplementation(async (args: any) => {
          txCalls['inventory.update'].push(args)
          return { ...inventory, ...args.data }
        }),
        create: jest.fn().mockImplementation(async (args: any) => {
          txCalls['inventory.create'].push(args)
          return { id: inventory.id + 1000, ...args.data }
        }),
      },
      issue: {
        update: jest.fn().mockImplementation(async (args: any) => {
          txCalls['issue.update'].push(args)
          return { ...issue, ...args.data }
        }),
      },
    }
    return fn(tx)
  })

  return txCalls
}

describe('Feature: issue-resolution-workflow - Property Tests', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  it('Property 1: Resolve action sets correct issue and item state', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        const txCalls = setupMocks(issue, inventory)

        const res = await PATCH(createRequest({ issueId: issue.id, action: 'resolve' }))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.issue.status).toBe('RESOLVED')
        expect(data.issue.resolvedAt).toBeDefined()

        const invUpdates = txCalls['inventory.update']
        expect(invUpdates.length).toBe(1)
        expect(invUpdates[0].data.condition).toBe('WORKING')
      }),
      { numRuns: 100 }
    )
  })

  it('Property 2: Discard-and-replace marks old item as fully discarded', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        const txCalls = setupMocks(issue, inventory)

        const res = await PATCH(createRequest({ issueId: issue.id, action: 'discard_replace' }))
        expect(res.status).toBe(200)

        // First inventory.update is the discard of the old item
        const invUpdate = txCalls['inventory.update'][0]
        expect(invUpdate.data.condition).toBe('DISCARDED')
        expect(invUpdate.data.location).toBe('DISCARDED')
      }),
      { numRuns: 100 }
    )
  })

  it('Property 3: Discard-and-replace creates a valid replacement item', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        const txCalls = setupMocks(issue, inventory)

        const res = await PATCH(createRequest({ issueId: issue.id, action: 'discard_replace' }))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(txCalls['inventory.create'].length).toBe(1)
        const createData = txCalls['inventory.create'][0].data
        expect(createData.itemTag).toBe(inventory.itemTag)
        expect(createData.category).toBe(inventory.category)
        expect(createData.schoolId).toBe(inventory.schoolId)
        expect(createData.condition).toBe('WORKING')
        expect(data.newItem.id).not.toBe(inventory.id)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 4: Discard-and-replace closes the issue', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        setupMocks(issue, inventory)

        const res = await PATCH(createRequest({ issueId: issue.id, action: 'discard_replace' }))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.issue.status).toBe('CLOSED')
        expect(data.issue.resolvedAt).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  it('Property 5: Discard action sets correct issue and item state', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        const txCalls = setupMocks(issue, inventory)

        const res = await PATCH(createRequest({ issueId: issue.id, action: 'discard' }))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(txCalls['inventory.update'].length).toBe(1)
        expect(txCalls['inventory.update'][0].data.condition).toBe('DISCARDED')
        expect(txCalls['inventory.update'][0].data.location).toBe('DISCARDED')
        expect(data.issue.status).toBe('CLOSED')
        expect(data.issue.resolvedAt).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  it('Property 6: Discard action creates no new inventory items', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        const txCalls = setupMocks(issue, inventory)

        await PATCH(createRequest({ issueId: issue.id, action: 'discard' }))

        expect(txCalls['inventory.create']).toHaveLength(0)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 7: Tag uniqueness invariant — at most one WORKING item per tag', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        const invWithTag = { ...inventory, itemTag: 'SHARED-TAG' }
        const fullIssue = { ...issue, inventoryId: invWithTag.id, inventory: invWithTag }

        mockPrisma.issue.findUnique.mockResolvedValue(fullIssue)
        mockPrisma.$transaction.mockImplementation(async (fn: any) => {
          const tx = {
            inventory: {
              findFirst: jest.fn().mockResolvedValue({ id: invWithTag.id + 999, itemTag: 'SHARED-TAG', condition: 'WORKING' }),
              update: jest.fn(),
              create: jest.fn(),
            },
            issue: { update: jest.fn() },
          }
          return fn(tx)
        })

        const resResolve = await PATCH(createRequest({ issueId: issue.id, action: 'resolve' }))
        expect(resResolve.status).toBe(409)

        const resReplace = await PATCH(createRequest({ issueId: issue.id, action: 'discard_replace' }))
        expect(resReplace.status).toBe(409)
      }),
      { numRuns: 100 }
    )
  })

  it('Property 8: Discard-and-replace response includes new item', async () => {
    await fc.assert(
      fc.asyncProperty(issueArb, inventoryArb, async (issue, inventory) => {
        resetAllMocks()
        setupMocks(issue, inventory)

        const res = await PATCH(createRequest({ issueId: issue.id, action: 'discard_replace' }))
        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data).toHaveProperty('issue')
        expect(data).toHaveProperty('newItem')
        expect(data.newItem).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  it('Property 9: API accepts all valid action values', async () => {
    await fc.assert(
      fc.asyncProperty(
        issueArb,
        inventoryArb,
        fc.constantFrom('resolve', 'discard_replace', 'discard'),
        async (issue, inventory, action) => {
          resetAllMocks()
          setupMocks(issue, inventory)

          const res = await PATCH(createRequest({ issueId: issue.id, action }))
          expect(res.status).not.toBe(400)
        }
      ),
      { numRuns: 100 }
    )
  })
})
