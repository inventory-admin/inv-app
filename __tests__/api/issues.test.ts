import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { POST, PATCH } from '@/app/api/issues/route'

function createRequest(body: any): Request {
  return { json: async () => body } as Request
}

describe('POST /api/issues', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should create an issue and update inventory condition', async () => {
    const mockIssue = {
      id: 1,
      inventoryId: 5,
      schoolId: 1,
      issueType: 'HARDWARE_FAILURE',
      description: 'Screen is cracked',
      reportedBy: 'Admin',
    }
    mockPrisma.$transaction.mockResolvedValue([mockIssue])

    const req = createRequest({
      inventoryId: 5,
      schoolId: 1,
      issueType: 'HARDWARE_FAILURE',
      description: 'Screen is cracked',
      reportedBy: 'Admin',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual(mockIssue)
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('should set condition to NOT_WORKING for HARDWARE_FAILURE', async () => {
    mockPrisma.$transaction.mockResolvedValue([{ id: 1 }])

    const req = createRequest({
      inventoryId: 1,
      issueType: 'HARDWARE_FAILURE',
      description: 'Test',
      reportedBy: 'Admin',
    })

    await POST(req)

    const transactionCalls = mockPrisma.$transaction.mock.calls[0][0]
    expect(transactionCalls.length).toBe(2) // issue create + inventory update
  })

  it('should set condition to NOT_WORKING for PHYSICAL_DAMAGE', async () => {
    mockPrisma.$transaction.mockResolvedValue([{ id: 1 }])

    const req = createRequest({
      inventoryId: 1,
      issueType: 'PHYSICAL_DAMAGE',
      description: 'Test',
      reportedBy: 'Admin',
    })

    await POST(req)

    const transactionCalls = mockPrisma.$transaction.mock.calls[0][0]
    expect(transactionCalls.length).toBe(2) // issue create + inventory update
  })

  it('should set condition to DISCARDED for MISSING', async () => {
    mockPrisma.$transaction.mockResolvedValue([{ id: 1 }])

    const req = createRequest({
      inventoryId: 1,
      issueType: 'MISSING',
      description: 'Test',
      reportedBy: 'Admin',
    })

    await POST(req)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('should not update condition for OTHER issue type', async () => {
    mockPrisma.$transaction.mockResolvedValue([{ id: 1 }])

    const req = createRequest({
      inventoryId: 1,
      issueType: 'OTHER',
      description: 'Test',
      reportedBy: 'Admin',
    })

    await POST(req)

    const transactionCalls = mockPrisma.$transaction.mock.calls[0][0]
    expect(transactionCalls.length).toBe(1) // only issue create, no inventory update
  })

  it('should return 500 on error', async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error('DB error'))

    const req = createRequest({
      inventoryId: 999,
      issueType: 'OTHER',
      description: 'Test',
      reportedBy: 'Admin',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create issue')
  })
})

describe('PATCH /api/issues', () => {
  const mockIssueWithInventory = {
    id: 1,
    inventoryId: 5,
    status: 'OPEN',
    inventory: {
      id: 5,
      itemTag: 'TAG-001',
      itemName: 'Laptop',
      category: 'LAPTOP',
      schoolId: 1,
      condition: 'NOT_WORKING',
      location: 'IN_OFFICE',
      quantity: 1,
      lastModifiedBy: 'admin',
    },
  }

  beforeEach(() => {
    resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return 400 for invalid action', async () => {
    const req = createRequest({
      issueId: 1,
      action: 'IN_PROGRESS',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toMatch(/Invalid action/)
  })

  it('should set inventory condition to WORKING when resolving issue', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue(mockIssueWithInventory)
    mockPrisma.inventory.findFirst.mockResolvedValue(null)
    mockPrisma.issue.update.mockResolvedValue({ id: 1, status: 'RESOLVED' })
    mockPrisma.inventory.update.mockResolvedValue({ id: 5, condition: 'WORKING' })
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))

    const req = createRequest({
      issueId: 1,
      action: 'resolve',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.issue.status).toBe('RESOLVED')
    expect(mockPrisma.issue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'RESOLVED' }),
      })
    )
    expect(mockPrisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: { condition: 'WORKING' },
      })
    )
  })

  it('should discard inventory and close issue with discard action', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue(mockIssueWithInventory)
    mockPrisma.inventory.update.mockResolvedValue({ id: 5, condition: 'DISCARDED' })
    mockPrisma.issue.update.mockResolvedValue({ id: 1, status: 'CLOSED' })
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma))

    const req = createRequest({
      issueId: 1,
      action: 'discard',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.issue.status).toBe('CLOSED')
    expect(mockPrisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 5 },
        data: { condition: 'DISCARDED', location: 'DISCARDED' },
      })
    )
  })

  it('should return 404 if issue not found', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue(null)

    const req = createRequest({
      issueId: 999,
      action: 'resolve',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Issue not found')
  })

  it('should return 500 on error', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue(mockIssueWithInventory)
    mockPrisma.$transaction.mockImplementation(async () => {
      throw new Error('DB error')
    })

    const req = createRequest({
      issueId: 1,
      action: 'resolve',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update issue')
  })
})
