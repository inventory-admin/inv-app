import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import { POST } from '@/app/api/inventory/bulk-update/route'
import { revalidatePath } from 'next/cache'

function createRequest(body: any): Request {
  return { json: async () => body } as Request
}

describe('POST /api/inventory/bulk-update', () => {
  beforeEach(() => {
    resetAllMocks()
    ;(revalidatePath as jest.Mock).mockClear()
  })

  it('should update location for multiple items', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 3 })

    const req = createRequest({
      itemIds: [1, 2, 3],
      location: 'AT_SCHOOL',
      condition: '',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.updated).toBe(3)
    expect(mockPrisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2, 3] } },
      data: expect.objectContaining({ location: 'AT_SCHOOL' }),
    })
  })

  it('should update condition for multiple items', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 2 })

    const req = createRequest({
      itemIds: [4, 5],
      location: '',
      condition: 'NOT_WORKING',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(mockPrisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [4, 5] } },
      data: expect.objectContaining({ condition: 'NOT_WORKING' }),
    })
  })

  it('should update both location and condition', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })

    const req = createRequest({
      itemIds: [1],
      location: 'DISCARDED',
      condition: 'DISCARDED',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(mockPrisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
      data: expect.objectContaining({
        location: 'DISCARDED',
        condition: 'DISCARDED',
      }),
    })
  })

  it('should not include empty fields in update data', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })

    const req = createRequest({
      itemIds: [1],
      location: 'IN_OFFICE',
      condition: '',
    })

    await POST(req)

    const callArgs = mockPrisma.inventory.updateMany.mock.calls[0][0]
    expect(callArgs.data.location).toBe('IN_OFFICE')
    expect(callArgs.data.condition).toBeUndefined()
  })

  it('should always set updatedAt', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })

    const req = createRequest({
      itemIds: [1],
      location: 'AT_SCHOOL',
      condition: '',
    })

    await POST(req)

    const callArgs = mockPrisma.inventory.updateMany.mock.calls[0][0]
    expect(callArgs.data.updatedAt).toBeInstanceOf(Date)
  })

  it('should revalidate paths after update', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })

    const req = createRequest({
      itemIds: [1],
      location: 'AT_SCHOOL',
      condition: '',
    })

    await POST(req)

    expect(revalidatePath).toHaveBeenCalledWith('/inventory')
    expect(revalidatePath).toHaveBeenCalledWith('/schools')
  })

  it('should return 500 on error', async () => {
    mockPrisma.inventory.updateMany.mockRejectedValue(new Error('DB error'))

    const req = createRequest({
      itemIds: [1],
      location: 'AT_SCHOOL',
      condition: '',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to bulk update inventory')
  })

  it('should handle empty itemIds array', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 0 })

    const req = createRequest({
      itemIds: [],
      location: 'AT_SCHOOL',
      condition: '',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.updated).toBe(0)
  })

  it('should handle non-existent item IDs gracefully', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValueOnce({ count: 0 })

    const req = createRequest({
      itemIds: [9999, 8888],
      location: 'AT_SCHOOL',
      condition: '',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.updated).toBe(0)
  })

  it('should handle both fields empty (no-op update)', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })

    const req = createRequest({
      itemIds: [1],
      location: '',
      condition: '',
    })

    const response = await POST(req)

    expect(mockPrisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
      data: expect.objectContaining({ updatedAt: expect.any(Date) }),
    })
  })
})