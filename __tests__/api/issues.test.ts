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
  beforeEach(() => {
    resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should update issue status', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({ id: 1, inventoryId: 5 })
    mockPrisma.$transaction.mockResolvedValue([{ id: 1, status: 'IN_PROGRESS' }])

    const req = createRequest({
      issueId: 1,
      status: 'IN_PROGRESS',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('IN_PROGRESS')
  })

  it('should set inventory condition to WORKING when resolving issue', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({ id: 1, inventoryId: 5 })
    mockPrisma.$transaction.mockResolvedValue([{ id: 1, status: 'RESOLVED' }])

    const req = createRequest({
      issueId: 1,
      status: 'RESOLVED',
    })

    await PATCH(req)

    const transactionCalls = mockPrisma.$transaction.mock.calls[0][0]
    expect(transactionCalls.length).toBe(2) // issue update + inventory update
  })

  it('should set inventory condition to WORKING when closing issue', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({ id: 1, inventoryId: 5 })
    mockPrisma.$transaction.mockResolvedValue([{ id: 1, status: 'CLOSED' }])

    const req = createRequest({
      issueId: 1,
      status: 'CLOSED',
    })

    await PATCH(req)

    const transactionCalls = mockPrisma.$transaction.mock.calls[0][0]
    expect(transactionCalls.length).toBe(2)
  })

  it('should not update inventory when changing to IN_PROGRESS', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({ id: 1, inventoryId: 5 })
    mockPrisma.$transaction.mockResolvedValue([{ id: 1, status: 'IN_PROGRESS' }])

    const req = createRequest({
      issueId: 1,
      status: 'IN_PROGRESS',
    })

    await PATCH(req)

    const transactionCalls = mockPrisma.$transaction.mock.calls[0][0]
    expect(transactionCalls.length).toBe(1) // only issue update
  })

  it('should return 404 if issue not found', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue(null)

    const req = createRequest({
      issueId: 999,
      status: 'RESOLVED',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Issue not found')
  })

  it('should return 500 on error', async () => {
    mockPrisma.issue.findUnique.mockResolvedValue({ id: 1, inventoryId: 5 })
    mockPrisma.$transaction.mockRejectedValue(new Error('DB error'))

    const req = createRequest({
      issueId: 1,
      status: 'RESOLVED',
    })

    const response = await PATCH(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update issue')
  })
})
