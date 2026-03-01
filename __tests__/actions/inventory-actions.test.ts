import { mockPrisma, resetAllMocks } from '../../__mocks__/prisma'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

import { createInventory, updateInventory, deleteInventory } from '@/app/inventory/actions'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.set(key, value)
  })
  return formData
}

describe('Inventory Server Actions', () => {
  beforeEach(() => {
    resetAllMocks()
    ;(revalidatePath as jest.Mock).mockClear()
    ;(redirect as unknown as jest.Mock).mockClear()
  })

  describe('createInventory', () => {
    it('should create an inventory item with all fields', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'UPS Unit',
        category: 'UPS',
        location: 'IN_OFFICE',
        condition: 'WORKING',
        quantity: '5',
        minStockLevel: '2',
        itemTag: 'UPS-001',
        schoolId: '1',
        notes: 'New purchase',
        lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: {
          itemName: 'UPS Unit',
          category: 'UPS',
          location: 'IN_OFFICE',
          condition: 'WORKING',
          quantity: 5,
          minStockLevel: 2,
          itemTag: 'UPS-001',
          schoolId: 1,
          notes: 'New purchase',
          lastModifiedBy: 'Admin',
        },
      })
    })

    it('should handle null optional fields', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Mouse',
        category: 'MOUSE',
        location: 'IN_OFFICE',
        condition: 'WORKING',
        quantity: '1',
        minStockLevel: '',
        itemTag: '',
        schoolId: '',
        notes: '',
        lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          minStockLevel: null,
          itemTag: null,
          schoolId: null,
          notes: null,
        }),
      })
    })

    it('should parse quantity as integer', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '10', minStockLevel: '3',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantity: 10,
          minStockLevel: 3,
        }),
      })
    })

    it('should parse schoolId as integer when provided', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '42', notes: '', lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: 42,
        }),
      })
    })

    it('should revalidate /inventory and /schools', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(revalidatePath).toHaveBeenCalledWith('/inventory')
      expect(revalidatePath).toHaveBeenCalledWith('/schools')
    })

    it('should redirect to /inventory', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(redirect).toHaveBeenCalledWith('/inventory')
    })

    it('should handle all valid categories', async () => {
      const categories = ['UPS', 'KEYBOARD', 'MOUSE', 'CPU', 'SCREEN']

      for (const category of categories) {
        resetAllMocks()
        mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

        const formData = createFormData({
          itemName: 'Test', category, location: 'IN_OFFICE',
          condition: 'WORKING', quantity: '1', minStockLevel: '',
          itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
        })

        await createInventory(formData)

        expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ category }),
        })
      }
    })

    it('should handle all valid conditions', async () => {
      const conditions = ['WORKING', 'NOT_WORKING', 'DISCARDED']

      for (const condition of conditions) {
        resetAllMocks()
        mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

        const formData = createFormData({
          itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
          condition, quantity: '1', minStockLevel: '',
          itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
        })

        await createInventory(formData)

        expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ condition }),
        })
      }
    })

    it('should handle all valid locations', async () => {
      const locations = ['IN_OFFICE', 'AT_SCHOOL', 'DISCARDED']

      for (const location of locations) {
        resetAllMocks()
        mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

        const formData = createFormData({
          itemName: 'Test', category: 'UPS', location,
          condition: 'WORKING', quantity: '1', minStockLevel: '',
          itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
        })

        await createInventory(formData)

        expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ location }),
        })
      }
    })
  })

  describe('updateInventory', () => {
    it('should update an inventory item', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 5 })

      const formData = createFormData({
        itemName: 'Updated UPS', category: 'UPS', location: 'AT_SCHOOL',
        condition: 'NOT_WORKING', quantity: '3', minStockLevel: '1',
        itemTag: 'UPS-001', schoolId: '2', notes: 'Moved', lastModifiedBy: 'Admin',
      })

      await updateInventory(5, formData)

      expect(mockPrisma.inventory.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          itemName: 'Updated UPS',
          category: 'UPS',
          location: 'AT_SCHOOL',
          condition: 'NOT_WORKING',
          quantity: 3,
          minStockLevel: 1,
          itemTag: 'UPS-001',
          schoolId: 2,
          notes: 'Moved',
          lastModifiedBy: 'Admin',
        },
      })
    })

    it('should handle null optional fields on update', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await updateInventory(1, formData)

      expect(mockPrisma.inventory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          minStockLevel: null,
          itemTag: null,
          schoolId: null,
          notes: null,
        }),
      })
    })

    it('should revalidate /inventory and /schools', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 5 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await updateInventory(5, formData)

      expect(revalidatePath).toHaveBeenCalledWith('/inventory')
      expect(revalidatePath).toHaveBeenCalledWith('/schools')
    })

    it('should redirect to /inventory', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await updateInventory(1, formData)

      expect(redirect).toHaveBeenCalledWith('/inventory')
    })
  })

  describe('deleteInventory', () => {
    it('should soft-delete by setting location to DISCARDED', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 3 })

      await deleteInventory(3)

      expect(mockPrisma.inventory.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { location: 'DISCARDED' },
      })
    })

    it('should revalidate /inventory and /schools', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 3 })

      await deleteInventory(3)

      expect(revalidatePath).toHaveBeenCalledWith('/inventory')
      expect(revalidatePath).toHaveBeenCalledWith('/schools')
    })

    it('should redirect to /inventory', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 3 })

      await deleteInventory(3)

      expect(redirect).toHaveBeenCalledWith('/inventory')
    })

    it('should not call prisma.inventory.delete (soft delete only)', async () => {
      mockPrisma.inventory.update.mockResolvedValue({ id: 3 })

      await deleteInventory(3)

      expect(mockPrisma.inventory.delete).not.toHaveBeenCalled()
    })

    it('should throw when item does not exist', async () => {
      mockPrisma.inventory.update.mockRejectedValue(new Error('Record not found'))

      await expect(deleteInventory(999)).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('createInventory should throw on database error', async () => {
      mockPrisma.inventory.create.mockRejectedValue(new Error('DB error'))

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await expect(createInventory(formData)).rejects.toThrow()
    })

    it('updateInventory should throw on database error', async () => {
      mockPrisma.inventory.update.mockRejectedValue(new Error('DB error'))

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await expect(updateInventory(1, formData)).rejects.toThrow()
    })

    it('updateInventory should throw when item does not exist', async () => {
      mockPrisma.inventory.update.mockRejectedValue(new Error('Record not found'))

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await expect(updateInventory(999, formData)).rejects.toThrow()
    })
  })

  describe('input validation edge cases', () => {
    it('should handle zero quantity', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '0', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ quantity: 0 }),
      })
    })

    it('should handle negative quantity as parsed integer', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })

      const formData = createFormData({
        itemName: 'Test', category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '-5', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ quantity: -5 }),
      })
    })

    it('should handle very long item names', async () => {
      mockPrisma.inventory.create.mockResolvedValue({ id: 1 })
      const longName = 'A'.repeat(500)

      const formData = createFormData({
        itemName: longName, category: 'UPS', location: 'IN_OFFICE',
        condition: 'WORKING', quantity: '1', minStockLevel: '',
        itemTag: '', schoolId: '', notes: '', lastModifiedBy: 'Admin',
      })

      await createInventory(formData)

      expect(mockPrisma.inventory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ itemName: longName }),
      })
    })
  })
})
