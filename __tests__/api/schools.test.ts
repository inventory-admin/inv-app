import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { POST } from '@/app/api/schools/route'

function createRequest(body: any): Request {
  return {
    json: async () => body,
  } as Request
}

describe('POST /api/schools', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should create a school without devices', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Lincoln Elementary' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Lincoln Elementary' },
      devices: [],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.school).toEqual(createdSchool)
    expect(data.devices).toEqual([])
    expect(mockPrisma.school.create).toHaveBeenCalledWith({
      data: { schoolId: 'SCH001', name: 'Lincoln Elementary' },
    })
  })

  it('should create a school with devices', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Lincoln Elementary' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    const createdInventory = { id: 10, itemName: 'UPS', category: 'UPS' }
    mockPrisma.inventory.create.mockResolvedValue(createdInventory)
    mockPrisma.inventory.update.mockResolvedValue({ ...createdInventory, itemTag: 'SCH001/10/ups' })

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Lincoln Elementary' },
      devices: [{ itemType: 'UPS', quantity: 1 }],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.school).toEqual(createdSchool)
    expect(data.devices).toHaveLength(1)
    expect(data.devices[0].itemTag).toBe('SCH001/10/ups')
  })

  it('should create multiple devices based on quantity', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test School' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    let callCount = 0
    mockPrisma.inventory.create.mockImplementation(async () => {
      callCount++
      return { id: callCount, itemName: 'KEYBOARD', category: 'KEYBOARD' }
    })
    mockPrisma.inventory.update.mockImplementation(async ({ where, data }: any) => ({
      id: where.id,
      ...data,
    }))

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test School' },
      devices: [{ itemType: 'KEYBOARD', quantity: 3 }],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.devices).toHaveLength(3)
    expect(mockPrisma.inventory.create).toHaveBeenCalledTimes(3)
    expect(mockPrisma.inventory.update).toHaveBeenCalledTimes(3)
  })

  it('should set all new devices as WORKING and AT_SCHOOL', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)
    mockPrisma.inventory.create.mockResolvedValue({ id: 1 })
    mockPrisma.inventory.update.mockResolvedValue({ id: 1 })

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test' },
      devices: [{ itemType: 'CPU', quantity: 1 }],
    })

    await POST(req)

    expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        condition: 'WORKING',
        location: 'AT_SCHOOL',
        schoolId: 1,
      }),
    })
  })

  it('should generate correct item tags', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)
    mockPrisma.inventory.create.mockResolvedValue({ id: 42 })
    mockPrisma.inventory.update.mockResolvedValue({ id: 42 })

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test' },
      devices: [{ itemType: 'MOUSE', quantity: 1 }],
    })

    await POST(req)

    expect(mockPrisma.inventory.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { itemTag: 'SCH001/42/mouse' },
    })
  })

  it('should return 500 on error', async () => {
    mockPrisma.school.create.mockRejectedValue(new Error('Unique constraint violation'))

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Duplicate' },
      devices: [],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create school')
  })

  it('should handle empty devices array', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test' },
      devices: [],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.devices).toEqual([])
    expect(mockPrisma.inventory.create).not.toHaveBeenCalled()
  })

  it('should handle device with zero quantity', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test' },
      devices: [{ itemType: 'UPS', quantity: 0 }],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.devices).toHaveLength(0)
  })

  it('should handle multiple device types', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    let callId = 0
    mockPrisma.inventory.create.mockImplementation(async () => {
      callId++
      return { id: callId }
    })
    mockPrisma.inventory.update.mockImplementation(async ({ where }: any) => ({
      id: where.id,
    }))

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test' },
      devices: [
        { itemType: 'UPS', quantity: 2 },
        { itemType: 'KEYBOARD', quantity: 1 },
      ],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.devices).toHaveLength(3) // 2 UPS + 1 KEYBOARD
    expect(mockPrisma.inventory.create).toHaveBeenCalledTimes(3)
  })

  it('should handle very long school name', async () => {
    const longName = 'A'.repeat(500)
    const createdSchool = { id: 1, schoolId: 'SCH001', name: longName }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    const req = createRequest({
      school: { schoolId: 'SCH001', name: longName },
      devices: [],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.school.name).toBe(longName)
  })
})