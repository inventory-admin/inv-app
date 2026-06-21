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
    // Default: findMany returns items with valid existing state
    mockPrisma.inventory.findMany.mockResolvedValue([
      { id: 1, location: 'AT_SCHOOL', condition: 'WORKING' },
      { id: 2, location: 'AT_SCHOOL', condition: 'WORKING' },
      { id: 3, location: 'IN_OFFICE', condition: 'WORKING' },
    ])
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
      itemIds: [1, 2],
      location: '',
      condition: 'NOT_WORKING',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(mockPrisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
      data: expect.objectContaining({ condition: 'NOT_WORKING' }),
    })
  })

  it('should update both location and condition to DISCARDED', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.inventory.findMany.mockResolvedValue([
      { id: 1, location: 'IN_OFFICE', condition: 'NOT_WORKING' },
    ])

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

  it('should force both to DISCARDED when only location is DISCARDED', async () => {
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.inventory.findMany.mockResolvedValue([
      { id: 1, location: 'IN_OFFICE', condition: 'NOT_WORKING' },
    ])

    const req = createRequest({
      itemIds: [1],
      location: 'DISCARDED',
      condition: '',
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
    mockPrisma.inventory.findMany.mockResolvedValue([{ id: 1, location: 'AT_SCHOOL', condition: 'WORKING' }])
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

  it('should return 400 for empty itemIds array', async () => {
    const req = createRequest({
      itemIds: [],
      location: 'AT_SCHOOL',
      condition: '',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No items selected')
  })

  it('should block invalid combinations', async () => {
    mockPrisma.inventory.findMany.mockResolvedValue([
      { id: 1, location: 'AT_SCHOOL', condition: 'WORKING' },
    ])

    // Setting condition to DISCARDED without setting location to DISCARDED
    // but since our logic forces both to DISCARDED, this should actually succeed
    // Let's test setting location=AT_SCHOOL + condition=DISCARDED (via direct request)
    // We need to bypass the force logic — that only triggers if one is DISCARDED,
    // but here both will be forced. Let's test an actually invalid combo
    // by having an item AT_SCHOOL and only changing condition to DISCARDED:
    // The force logic will set BOTH to discarded so this actually passes.
    // Real test: item currently DISCARDED, try to set just location to AT_SCHOOL (no condition change)
    mockPrisma.inventory.findMany.mockResolvedValue([
      { id: 1, location: 'DISCARDED', condition: 'DISCARDED' },
    ])

    const req = createRequest({
      itemIds: [1],
      location: 'AT_SCHOOL',
      condition: '', // no change -> stays DISCARDED
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('not a valid combination')
  })

  it('should allow VENDOR location with NOT_WORKING condition', async () => {
    mockPrisma.inventory.findMany.mockResolvedValue([
      { id: 1, location: 'IN_OFFICE', condition: 'NOT_WORKING' },
    ])
    mockPrisma.inventory.updateMany.mockResolvedValue({ count: 1 })

    const req = createRequest({
      itemIds: [1],
      location: 'VENDOR',
      condition: '',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.success).toBe(true)
  })
})
