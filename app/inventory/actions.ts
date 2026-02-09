'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInventory(formData: FormData) {
  const itemName = formData.get('itemName') as string
  const category = formData.get('category') as 'UPS' | 'KEYBOARD' | 'MOUSE' | 'CPU' | 'SCREEN'
  const location = formData.get('location') as 'IN_OFFICE' | 'AT_SCHOOL' | 'DISCARDED'
  const condition = formData.get('condition') as 'WORKING' | 'NOT_WORKING' | 'DAMAGED' | 'DISCARDED'
  const quantity = parseInt(formData.get('quantity') as string)
  const minStockLevel = formData.get('minStockLevel') as string
  const itemTag = formData.get('itemTag') as string
  const schoolId = formData.get('schoolId') as string
  const notes = formData.get('notes') as string
  const lastModifiedBy = formData.get('lastModifiedBy') as string

  await prisma.inventory.create({
    data: {
      itemName,
      category,
      location,
      condition,
      quantity,
      minStockLevel: minStockLevel ? parseInt(minStockLevel) : null,
      itemTag: itemTag || null,
      schoolId: schoolId ? parseInt(schoolId) : null,
      notes: notes || null,
      lastModifiedBy,
    },
  })

  revalidatePath('/inventory')
  redirect('/inventory')
}

export async function updateInventory(id: number, formData: FormData) {
  const itemName = formData.get('itemName') as string
  const category = formData.get('category') as 'UPS' | 'KEYBOARD' | 'MOUSE' | 'CPU' | 'SCREEN'
  const location = formData.get('location') as 'IN_OFFICE' | 'AT_SCHOOL' | 'DISCARDED'
  const condition = formData.get('condition') as 'WORKING' | 'NOT_WORKING' | 'DAMAGED' | 'DISCARDED'
  const quantity = parseInt(formData.get('quantity') as string)
  const minStockLevel = formData.get('minStockLevel') as string
  const itemTag = formData.get('itemTag') as string
  const schoolId = formData.get('schoolId') as string
  const notes = formData.get('notes') as string
  const lastModifiedBy = formData.get('lastModifiedBy') as string

  await prisma.inventory.update({
    where: { id },
    data: {
      itemName,
      category,
      location,
      condition,
      quantity,
      minStockLevel: minStockLevel ? parseInt(minStockLevel) : null,
      itemTag: itemTag || null,
      schoolId: schoolId ? parseInt(schoolId) : null,
      notes: notes || null,
      lastModifiedBy,
    },
  })

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${id}`)
  redirect('/inventory')
}

export async function deleteInventory(id: number) {
  await prisma.inventory.update({
    where: { id },
    data: { location: 'DISCARDED' },
  })

  revalidatePath('/inventory')
  redirect('/inventory')
}
