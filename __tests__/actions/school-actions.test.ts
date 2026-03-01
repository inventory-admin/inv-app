import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

import { createSchool, updateSchool } from '@/app/schools/actions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.set(key, value)
  })
  return formData
}

describe('School Server Actions', () => {
  beforeEach(() => {
    resetAllMocks()
    ;(revalidatePath as jest.Mock).mockClear()
    ;(redirect as unknown as jest.Mock).mockClear()
  })

  describe('createSchool', () => {
    it('should create a school with name and schoolId', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test School', schoolId: 'SCH001' })

      const formData = createFormData({
        name: 'Test School',
        schoolId: 'SCH001',
      })

      await createSchool(formData)

      expect(mockPrisma.school.create).toHaveBeenCalledWith({
        data: { name: 'Test School', schoolId: 'SCH001' },
      })
    })

    it('should create devices when provided in form data', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })
      mockPrisma.inventory.create.mockResolvedValue({ id: 10 })

      const formData = createFormData({
        name: 'Test School',
        schoolId: 'SCH001',
        'devices[0].item': 'UPS',
        'devices[0].category': 'UPS',
        'devices[0].quantity': '2',
        'devices[0].tag': 'T-001',
      })

      await createSchool(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalled()
      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          itemName: 'UPS',
          category: 'UPS',
          quantity: 2,
          itemTag: 'T-001',
          location: 'AT_SCHOOL',
          schoolId: 1,
          lastModifiedBy: 'system',
        }),
      })
    })

    it('should create multiple devices from form data', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })
      mockPrisma.inventory.create.mockResolvedValue({ id: 10 })

      const formData = createFormData({
        name: 'Test',
        schoolId: 'SCH001',
        'devices[0].item': 'UPS',
        'devices[0].category': 'UPS',
        'devices[0].quantity': '1',
        'devices[0].tag': '',
        'devices[1].item': 'KEYBOARD',
        'devices[1].category': 'KEYBOARD',
        'devices[1].quantity': '3',
        'devices[1].tag': '',
      })

      await createSchool(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledTimes(2)
    })

    it('should skip devices with empty item name', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })

      const formData = createFormData({
        name: 'Test',
        schoolId: 'SCH001',
        'devices[0].item': '',
        'devices[0].category': 'UPS',
        'devices[0].quantity': '1',
        'devices[0].tag': '',
      })

      await createSchool(formData)

      expect(mockPrisma.inventory.create).not.toHaveBeenCalled()
    })

    it('should set null tag when empty', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 5, name: 'Test', schoolId: 'SCH005' })
      mockPrisma.inventory.create.mockResolvedValue({ id: 20 })

      const formData = createFormData({
        name: 'Test',
        schoolId: 'SCH005',
        'devices[0].item': 'KEYBOARD',
        'devices[0].category': 'KEYBOARD',
        'devices[0].quantity': '1',
        'devices[0].tag': '',
      })

      await createSchool(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          itemTag: null,
          location: 'AT_SCHOOL',
          schoolId: 5,
        }),
      })
    })

    it('should generate a unique itemId for each device', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })
      mockPrisma.inventory.create.mockResolvedValue({ id: 10 })

      const formData = createFormData({
        name: 'Test',
        schoolId: 'SCH001',
        'devices[0].item': 'UPS',
        'devices[0].category': 'UPS',
        'devices[0].quantity': '1',
        'devices[0].tag': '',
      })

      await createSchool(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          itemId: expect.stringMatching(/^INV-\d+-[A-Z0-9]+$/),
        }),
      })
    })

    it('should default quantity to 1 when not parseable', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })
      mockPrisma.inventory.create.mockResolvedValue({ id: 10 })

      const formData = createFormData({
        name: 'Test',
        schoolId: 'SCH001',
        'devices[0].item': 'UPS',
        'devices[0].category': 'UPS',
        'devices[0].quantity': 'abc',
        'devices[0].tag': '',
      })

      await createSchool(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantity: 1,
        }),
      })
    })

    it('should revalidate /schools and /inventory', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })

      const formData = createFormData({ name: 'Test', schoolId: 'SCH001' })

      await createSchool(formData)

      expect(revalidatePath).toHaveBeenCalledWith('/schools')
      expect(revalidatePath).toHaveBeenCalledWith('/inventory')
    })

    it('should redirect to /schools', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })

      const formData = createFormData({ name: 'Test', schoolId: 'SCH001' })

      await createSchool(formData)

      expect(redirect).toHaveBeenCalledWith('/schools')
    })
  })

  describe('updateSchool', () => {
    it('should update school name', async () => {
      mockPrisma.school.update.mockResolvedValue({ id: 1, name: 'New Name' })

      const formData = createFormData({ name: 'New Name' })

      await updateSchool(1, formData)

      expect(mockPrisma.school.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      })
    })

    it('should revalidate /schools', async () => {
      mockPrisma.school.update.mockResolvedValue({ id: 3, name: 'Updated' })

      const formData = createFormData({ name: 'Updated' })

      await updateSchool(3, formData)

      expect(revalidatePath).toHaveBeenCalledWith('/schools')
    })

    it('should redirect to /schools', async () => {
      mockPrisma.school.update.mockResolvedValue({ id: 1, name: 'Test' })

      const formData = createFormData({ name: 'Test' })

      await updateSchool(1, formData)

      expect(redirect).toHaveBeenCalledWith('/schools')
    })

    it('should use the correct id in the where clause', async () => {
      mockPrisma.school.update.mockResolvedValue({ id: 42, name: 'Test' })

      const formData = createFormData({ name: 'Test' })

      await updateSchool(42, formData)

      expect(mockPrisma.school.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { name: 'Test' },
      })
    })

    it('should throw when school does not exist', async () => {
      mockPrisma.school.update.mockRejectedValue(new Error('Record not found'))

      const formData = createFormData({ name: 'Test' })

      await expect(updateSchool(999, formData)).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('createSchool should throw on database error', async () => {
      mockPrisma.school.create.mockRejectedValue(new Error('DB error'))

      const formData = createFormData({ name: 'Test', schoolId: 'SCH001' })

      await expect(createSchool(formData)).rejects.toThrow()
    })

    it('createSchool should throw on duplicate schoolId', async () => {
      mockPrisma.school.create.mockRejectedValue(new Error('Unique constraint failed on the fields: (`schoolId`)'))

      const formData = createFormData({ name: 'Test', schoolId: 'DUPLICATE' })

      await expect(createSchool(formData)).rejects.toThrow()
    })

    it('updateSchool should throw on database error', async () => {
      mockPrisma.school.update.mockRejectedValue(new Error('DB error'))

      const formData = createFormData({ name: 'Test' })

      await expect(updateSchool(1, formData)).rejects.toThrow()
    })
  })

  describe('input validation edge cases', () => {
    it('should handle very long school names', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'A'.repeat(500), schoolId: 'SCH001' })
      const longName = 'A'.repeat(500)

      const formData = createFormData({ name: longName, schoolId: 'SCH001' })

      await createSchool(formData)

      expect(mockPrisma.school.create).toHaveBeenCalledWith({
        data: { name: longName, schoolId: 'SCH001' },
      })
    })

    it('should handle empty device array gracefully', async () => {
      mockPrisma.school.create.mockResolvedValue({ id: 1, name: 'Test', schoolId: 'SCH001' })

      const formData = createFormData({ name: 'Test', schoolId: 'SCH001' })

      await createSchool(formData)

      expect(mockPrisma.inventory.create).not.toHaveBeenCalled()
    })
  })
})