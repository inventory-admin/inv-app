'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSchool(formData: FormData) {
  const name = formData.get('name') as string
  const schoolId = formData.get('schoolId') as string

  // Create school
  const school = await prisma.school.create({
    data: { name, schoolId },
  })

  // Parse and create devices
  const deviceEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith('devices['))
    .reduce((acc, [key, value]) => {
      const match = key.match(/devices\[(\d+)\]\.(\w+)/)
      if (match) {
        const [, index, field] = match
        if (!acc[index]) acc[index] = {}
        acc[index][field] = value
      }
      return acc
    }, {} as Record<string, any>)

  // Create inventory items for this school
  for (const device of Object.values(deviceEntries)) {
    if (device.item && device.category) {
      // Generate unique itemId: INV-{timestamp}-{random}
      const itemId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      
      await prisma.inventory.create({
        data: {
          itemId,
          itemName: device.item as string,
          category: device.category as 'UPS' | 'KEYBOARD' | 'MOUSE' | 'CPU' | 'SCREEN',
          quantity: parseInt(device.quantity as string) || 1,
          itemTag: device.tag as string || null,
          location: 'AT_SCHOOL',
          schoolId: school.id,
          lastModifiedBy: 'system',
        },
      })
    }
  }

  revalidatePath('/schools')
  revalidatePath('/inventory')
  redirect('/schools')
}

export async function updateSchool(id: number, formData: FormData) {
  const name = formData.get('name') as string

  await prisma.school.update({
    where: { id },
    data: { name },
  })

  revalidatePath('/schools')
  revalidatePath(`/schools/${id}`)
  redirect('/schools')
}
