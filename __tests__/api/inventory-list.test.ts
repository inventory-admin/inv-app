import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { GET } from '@/app/api/inventory-list/route'

describe('GET /api/inventory-list', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return all inventory items with school data', async () => {
    const mockInventory = [
      {
        id: 1,
        itemName: 'UPS',
        category: 'UPS',
        condition: 'WORKING',
        location: 'AT_SCHOOL',
        school: { id: 1, name: 'Lincoln Elementary' },
      },
      {
        id: 2,
        itemName: 'Keyboard',
        category: 'KEYBOARD',
        condition: 'NOT_WORKING',
        location: 'IN_OFFICE',
        school: null,
      },
    ]

    mockPrisma.inventory.findMany.mockResolvedValue(mockInventory)

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual(mockInventory)
    expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith({
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  })

  it('should return empty array when no inventory exists', async () => {
    mockPrisma.inventory.findMany.mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual([])
  })

  it('should return 500 on database error', async () => {
    mockPrisma.inventory.findMany.mockRejectedValue(new Error('DB error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch inventory')
  })

  it('should order items by tag with natural numeric sorting', async () => {
    const mockItems = [
      { id: 1, itemTag: 'SCH/10/ups', itemName: 'UPS', school: null },
      { id: 2, itemTag: 'SCH/2/ups', itemName: 'UPS', school: null },
      { id: 3, itemTag: 'SCH/1/ups', itemName: 'UPS', school: null },
    ]
    mockPrisma.inventory.findMany.mockResolvedValue(mockItems)

    const response = await GET()
    const data = await response.json()

    // Should be sorted: 1, 2, 10 (not 1, 10, 2)
    expect(data[0].itemTag).toBe('SCH/1/ups')
    expect(data[1].itemTag).toBe('SCH/2/ups')
    expect(data[2].itemTag).toBe('SCH/10/ups')
  })

  it('should include school id and name only', async () => {
    mockPrisma.inventory.findMany.mockResolvedValue([])

    await GET()

    expect(mockPrisma.inventory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    )
  })
})