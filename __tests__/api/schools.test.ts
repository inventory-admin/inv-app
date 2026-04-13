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
    // Default: no existing inventory for the school
    mockPrisma.inventory.count.mockResolvedValue(0)
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

  it('should create a school with devices and per-category sequential tags', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Lincoln Elementary' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    let callId = 0
    mockPrisma.inventory.create.mockImplementation(async (args: any) => {
      callId++
      return { id: callId, ...args.data }
    })

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Lincoln Elementary' },
      devices: [{ itemType: 'UPS', quantity: 1 }],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.devices).toHaveLength(1)
    expect(data.devices[0].itemTag).toBe('SCH001/1/ups')
  })

  it('should generate per-category sequential numbering', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test School' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    let callId = 0
    mockPrisma.inventory.create.mockImplementation(async (args: any) => {
      callId++
      return { id: callId, ...args.data }
    })

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test School' },
      devices: [
        { itemType: 'UPS', quantity: 2 },
        { itemType: 'KEYBOARD', quantity: 2 },
      ],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.devices).toHaveLength(4)
    // UPS should be numbered 1, 2
    expect(data.devices[0].itemTag).toBe('SCH001/1/ups')
    expect(data.devices[1].itemTag).toBe('SCH001/2/ups')
    // KEYBOARD should be numbered 1, 2 (separate from UPS)
    expect(data.devices[2].itemTag).toBe('SCH001/1/keyboard')
    expect(data.devices[3].itemTag).toBe('SCH001/2/keyboard')
  })

  it('should continue numbering from existing items of same category', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test School' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)

    // Simulate 3 existing UPS items at this school
    mockPrisma.inventory.count.mockImplementation(async (args: any) => {
      if (args.where.category === 'UPS') return 3
      return 0
    })

    let callId = 100
    mockPrisma.inventory.create.mockImplementation(async (args: any) => {
      callId++
      return { id: callId, ...args.data }
    })

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test School' },
      devices: [{ itemType: 'UPS', quantity: 2 }],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.devices).toHaveLength(2)
    // Should continue from 4 (3 existing + 1) and 5
    expect(data.devices[0].itemTag).toBe('SCH001/4/ups')
    expect(data.devices[1].itemTag).toBe('SCH001/5/ups')
  })

  it('should set all new devices as WORKING and AT_SCHOOL', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)
    mockPrisma.inventory.create.mockImplementation(async (args: any) => ({ id: 1, ...args.data }))

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

  it('should set tag at creation time (no separate update)', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)
    mockPrisma.inventory.create.mockImplementation(async (args: any) => ({ id: 1, ...args.data }))

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test' },
      devices: [{ itemType: 'MOUSE', quantity: 1 }],
    })

    await POST(req)

    // Tag should be set in the create call, not via a separate update
    expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemTag: 'SCH001/1/mouse',
      }),
    })
    expect(mockPrisma.inventory.update).not.toHaveBeenCalled()
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

  it('should handle new category types', async () => {
    const createdSchool = { id: 1, schoolId: 'SCH001', name: 'Test' }
    mockPrisma.school.create.mockResolvedValue(createdSchool)
    mockPrisma.inventory.create.mockImplementation(async (args: any) => ({ id: 1, ...args.data }))

    const req = createRequest({
      school: { schoolId: 'SCH001', name: 'Test' },
      devices: [
        { itemType: 'HDMI_CABLE', quantity: 1 },
        { itemType: 'POWER_ADAPTOR', quantity: 1 },
      ],
    })

    const response = await POST(req)
    const data = await response.json()

    expect(data.devices).toHaveLength(2)
    expect(data.devices[0].itemTag).toBe('SCH001/1/hdmi_cable')
    expect(data.devices[1].itemTag).toBe('SCH001/1/power_adaptor')
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
