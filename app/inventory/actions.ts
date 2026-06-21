'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isValidCombo, LOCATION_LABELS, CONDITION_LABELS } from '@/lib/inventory-status'

export async function createInventory(formData: FormData) {
  const itemName = formData.get('itemName') as string
  const category = formData.get('category') as 'UPS' | 'KEYBOARD' | 'MOUSE' | 'CPU' | 'SCREEN' | 'POWER_ADAPTOR' | 'WIFI_RECEIVER' | 'THREE_PIN' | 'VGA_CABLE' | 'HDMI_CABLE'
  const location = formData.get('location') as 'IN_OFFICE' | 'AT_SCHOOL' | 'VENDOR' | 'DISCARDED'
  const condition = formData.get('condition') as 'WORKING' | 'NOT_WORKING' | 'DISCARDED'
  const quantity = parseInt(formData.get('quantity') as string)
  const itemTag = formData.get('itemTag') as string
  const schoolId = formData.get('schoolId') as string
  const notes = formData.get('notes') as string
  const lastModifiedBy = formData.get('lastModifiedBy') as string

  // Enforce the Location x Condition matrix
  if (!isValidCombo(location, condition)) {
    throw new Error(`Invalid combination: ${LOCATION_LABELS[location] ?? location} cannot be paired with ${CONDITION_LABELS[condition] ?? condition}`)
  }

  await prisma.inventory.create({
    data: {
      itemName,
      category,
      location,
      condition,
      quantity,
      itemTag: itemTag || null,
      schoolId: schoolId ? parseInt(schoolId) : null,
      notes: notes || null,
      lastModifiedBy,
    },
  })

  revalidatePath('/inventory')
  revalidatePath('/schools')
  redirect('/inventory')
}

export async function updateInventory(id: number, formData: FormData) {
  const itemName = formData.get('itemName') as string
  const category = formData.get('category') as 'UPS' | 'KEYBOARD' | 'MOUSE' | 'CPU' | 'SCREEN' | 'POWER_ADAPTOR' | 'WIFI_RECEIVER' | 'THREE_PIN' | 'VGA_CABLE' | 'HDMI_CABLE'
  const location = formData.get('location') as 'IN_OFFICE' | 'AT_SCHOOL' | 'VENDOR' | 'DISCARDED'
  const condition = formData.get('condition') as 'WORKING' | 'NOT_WORKING' | 'DISCARDED'
  const quantity = parseInt(formData.get('quantity') as string)
  const itemTag = formData.get('itemTag') as string
  const schoolId = formData.get('schoolId') as string
  const notes = formData.get('notes') as string
  const lastModifiedBy = formData.get('lastModifiedBy') as string

  const tagValue = itemTag || null

  // Enforce the Location x Condition matrix
  if (!isValidCombo(location, condition)) {
    throw new Error(`Invalid combination: ${LOCATION_LABELS[location] ?? location} cannot be paired with ${CONDITION_LABELS[condition] ?? condition}`)
  }

  // Tag uniqueness check: if setting to WORKING with a non-null tag,
  // ensure no other WORKING item has the same tag
  if (condition === 'WORKING' && tagValue) {
    const conflicting = await prisma.inventory.findFirst({
      where: {
        itemTag: tagValue,
        condition: 'WORKING',
        id: { not: id },
      },
    })
    if (conflicting) {
      throw new Error(`Cannot set condition to WORKING: another item with tag '${tagValue}' is already WORKING`)
    }
  }

  await prisma.inventory.update({
    where: { id },
    data: {
      itemName,
      category,
      location,
      condition,
      quantity,
      itemTag: tagValue,
      schoolId: schoolId ? parseInt(schoolId) : null,
      notes: notes || null,
      lastModifiedBy,
    },
  })

  revalidatePath('/inventory')
  revalidatePath('/schools')
  redirect('/inventory')
}

export async function deleteInventory(id: number) {
  await prisma.inventory.update({
    where: { id },
    data: { location: 'DISCARDED', condition: 'DISCARDED' },
  })

  revalidatePath('/inventory')
  revalidatePath('/schools')
  redirect('/inventory')
}
