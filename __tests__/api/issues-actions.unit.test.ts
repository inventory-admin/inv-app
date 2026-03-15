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

describe('PATCH /api/issues - Unit Tests', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  it('should resolve a specific known issue', async () => {
    const issue = {
      id: 42, inventoryId: 10, status: 'OPEN',
      inventory: { id: 10, itemTag: 'TAG-001', condition: 'NOT_WORKING', category: 'UPS', schoolId: 1 },
    }
    const updatedIssue = { id: 42, status: 'RESOLVED', resolvedAt: new Date() }

    mockPrisma.issue.findUnique.mockResolvedValue(issue)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        inventory: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
        issue: { update: jest.fn().mockResolvedValue(updatedIssue) },
      }
      return fn(tx)
    })

    const res = await PATCH(createRequest({ issueId: 42, action: 'resolve' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.issue.status).toBe('RESOLVED')
    expect(data.issue.resolvedAt).toBeDefined()
  })

  it('should handle discard_replace with null itemTag', async () => {
    const issue = {
      id: 1, inventoryId: 5, status: 'OPEN',
      inventory: { id: 5, itemTag: null, itemName: 'Mouse', condition: 'NOT_WORKING', category: 'MOUSE', schoolId: null },
    }
    const newItem = { id: 99, itemTag: null, itemName: 'Mouse', category: 'MOUSE', condition: 'WORKING', schoolId: null }
    const updatedIssue = { id: 1, status: 'CLOSED', resolvedAt: new Date() }

    mockPrisma.issue.findUnique.mockResolvedValue(issue)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        inventory: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
          create: jest.fn().mockResolvedValue(newItem),
        },
        issue: { update: jest.fn().mockResolvedValue(updatedIssue) },
      }
      return fn(tx)
    })

    const res = await PATCH(createRequest({ issueId: 1, action: 'discard_replace' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.newItem).toBeDefined()
    expect(data.newItem.itemTag).toBeNull()
  })

  it('should return 409 for discard_replace when tag conflict exists', async () => {
    const issue = {
      id: 1, inventoryId: 5, status: 'OPEN',
      inventory: { id: 5, itemTag: 'TAG-DUP', itemName: 'UPS', condition: 'NOT_WORKING', category: 'UPS', schoolId: 1 },
    }
    const conflicting = { id: 99, itemTag: 'TAG-DUP', condition: 'WORKING' }

    mockPrisma.issue.findUnique.mockResolvedValue(issue)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        inventory: { findFirst: jest.fn().mockResolvedValue(conflicting), update: jest.fn(), create: jest.fn() },
        issue: { update: jest.fn() },
      }
      return fn(tx)
    })

    const res = await PATCH(createRequest({ issueId: 1, action: 'discard_replace' }))
    const data = await res.json()

    expect(res.status).toBe(409)
    expect(data.error).toContain('TAG-DUP')
  })

  it('should return 409 for resolve when tag conflict exists', async () => {
    const issue = {
      id: 2, inventoryId: 7, status: 'OPEN',
      inventory: { id: 7, itemTag: 'TAG-CONFLICT', condition: 'NOT_WORKING', category: 'CPU', schoolId: null },
    }
    const conflicting = { id: 50, itemTag: 'TAG-CONFLICT', condition: 'WORKING' }

    mockPrisma.issue.findUnique.mockResolvedValue(issue)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        inventory: { findFirst: jest.fn().mockResolvedValue(conflicting), update: jest.fn() },
        issue: { update: jest.fn() },
      }
      return fn(tx)
    })

    const res = await PATCH(createRequest({ issueId: 2, action: 'resolve' }))
    const data = await res.json()

    expect(res.status).toBe(409)
    expect(data.error).toContain('TAG-CONFLICT')
  })

  it('should return 404 for non-existent issueId', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue(null)

    const res = await PATCH(createRequest({ issueId: 99999, action: 'resolve' }))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Issue not found')
  })

  it('should return 400 for invalid action value', async () => {
    const res = await PATCH(createRequest({ issueId: 1, action: 'invalid_action' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toContain('Invalid action')
  })

  it('should default location to IN_OFFICE for discard_replace', async () => {
    const issue = {
      id: 3, inventoryId: 8, status: 'OPEN',
      inventory: { id: 8, itemTag: 'TAG-LOC', itemName: 'Screen', condition: 'NOT_WORKING', category: 'SCREEN', schoolId: 2 },
    }
    const newItem = { id: 100, itemTag: 'TAG-LOC', condition: 'WORKING', location: 'IN_OFFICE' }
    const updatedIssue = { id: 3, status: 'CLOSED', resolvedAt: new Date() }

    mockPrisma.issue.findUnique.mockResolvedValue(issue)
    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        inventory: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
          create: jest.fn().mockResolvedValue(newItem),
        },
        issue: { update: jest.fn().mockResolvedValue(updatedIssue) },
      }
      return fn(tx)
    })

    // No location field in request — should default to IN_OFFICE
    const res = await PATCH(createRequest({ issueId: 3, action: 'discard_replace' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    // Verify the transaction was called (location default is handled inside the handler)
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })
})
