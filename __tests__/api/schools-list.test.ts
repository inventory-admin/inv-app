import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { GET } from '@/app/api/schools-list/route'

describe('GET /api/schools-list', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return all schools with inventory data', async () => {
    const mockSchools = [
      {
        id: 1,
        name: 'Lincoln Elementary',
        schoolId: 'SCH001',
        inventory: [
          { condition: 'WORKING', location: 'AT_SCHOOL' },
          { condition: 'NOT_WORKING', location: 'AT_SCHOOL' },
        ],
      },
      {
        id: 2,
        name: 'Washington Middle',
        schoolId: 'SCH002',
        inventory: [
          { condition: 'WORKING', location: 'IN_OFFICE' },
        ],
      },
    ]

    mockPrisma.school.findMany.mockResolvedValue(mockSchools)

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual(mockSchools)
    expect(mockPrisma.school.findMany).toHaveBeenCalledWith({
      include: {
        inventory: {
          select: {
            condition: true,
            location: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  })

  it('should return empty array when no schools exist', async () => {
    mockPrisma.school.findMany.mockResolvedValue([])

    const response = await GET()
    const data = await response.json()

    expect(data).toEqual([])
  })

  it('should return 500 on database error', async () => {
    mockPrisma.school.findMany.mockRejectedValue(new Error('DB connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch schools')
  })

  it('should order schools alphabetically by name', async () => {
    mockPrisma.school.findMany.mockResolvedValue([])

    await GET()

    expect(mockPrisma.school.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      })
    )
  })

  it('should include only condition and location from inventory', async () => {
    mockPrisma.school.findMany.mockResolvedValue([])

    await GET()

    expect(mockPrisma.school.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          inventory: {
            select: {
              condition: true,
              location: true,
            },
          },
        },
      })
    )
  })
})