import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { POST } from '@/app/api/inventory/route'

function createRequest(body: any): Request {
  return { json: async () => body } as Request
}

describe('POST /api/inventory', () => {
  beforeEach(() => {
    resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should create an inventory item', async () => {
    const mockItem = {
      id: 1,
      itemName: 'UPS Unit',
      category: 'UPS',
      quantity: 5,
      condition: 'WORKING',
      location: 'IN_OFFICE',
    }
    mockPrisma.inventory.create.mockResolvedValue(mockItem)

    const req = createRequest({
      itemName: 'UPS Unit',
      category: 'UPS',
      quantity: 5,
      condition: 'WORKING',
      location: 'IN_OFFICE',
      lastModifiedBy: 'Admin',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual(mockItem)
  })

  it('should pass correct data to prisma create', async () => {
    mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

    const req = createRequest({
      itemName: 'Keyboard',
      category: 'KEYBOARD',
      quantity: 10,
      condition: 'WORKING',
      location: 'AT_SCHOOL',
      itemTag: 'KB-001',
      notes: 'Bulk purchase',
      lastModifiedBy: 'Admin',
    })

    await POST(req)

    expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
      data: {
        itemName: 'Keyboard',
        category: 'KEYBOARD',
        quantity: 10,
        condition: 'WORKING',
        location: 'AT_SCHOOL',
        itemTag: 'KB-001',
        notes: 'Bulk purchase',
        lastModifiedBy: 'Admin',
      },
    })
  })

  it('should handle null optional fields', async () => {
    mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

    const req = createRequest({
      itemName: 'Mouse',
      category: 'MOUSE',
      quantity: 1,
      condition: 'WORKING',
      location: 'IN_OFFICE',
      lastModifiedBy: 'Admin',
    })

    await POST(req)

    expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemTag: null,
        notes: null,
      }),
    })
  })

  it('should return 500 on error', async () => {
    mockPrisma.inventory.create.mockRejectedValue(new Error('DB error'))

    const req = createRequest({
      itemName: 'Broken',
      category: 'CPU',
      quantity: 1,
      condition: 'WORKING',
      location: 'IN_OFFICE',
      lastModifiedBy: 'Admin',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create inventory item')
  })

  it('should handle missing optional fields', async () => {
    mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

    const req = createRequest({
      itemName: 'Minimal',
      category: 'CPU',
      quantity: 1,
      condition: 'WORKING',
      location: 'IN_OFFICE',
      lastModifiedBy: 'Admin',
      // no itemTag, notes, schoolId
    })

    await POST(req)

    expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemTag: null,
        notes: null,
      }),
    })
  })

  it('should handle zero quantity', async () => {
    mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

    const req = createRequest({
      itemName: 'Test',
      category: 'UPS',
      quantity: 0,
      condition: 'WORKING',
      location: 'IN_OFFICE',
      lastModifiedBy: 'Admin',
    })

    await POST(req)

    expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ quantity: 0 }),
    })
  })
})