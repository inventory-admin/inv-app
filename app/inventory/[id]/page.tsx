import { prisma } from '@/lib/prisma'
import { updateInventory } from '../actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditInventoryPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const item = await prisma.inventory.findUnique({ where: { id } })
  
  if (!item) notFound()

  const schools = await prisma.school.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Device #{item.id}</h1>

      <form action={updateInventory.bind(null, id)} className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Item Name *</label>
          <input
            type="text"
            name="itemName"
            required
            defaultValue={item.itemName}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <input
            type="text"
            name="category"
            required
            defaultValue={item.category}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity *</label>
          <input
            type="number"
            name="quantity"
            required
            min="1"
            defaultValue={item.quantity}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Condition *</label>
          <select name="condition" className="w-full border rounded px-3 py-2" defaultValue={item.condition}>
            <option value="WORKING">Working</option>
            <option value="NOT_WORKING">Not Working</option>
            <option value="DAMAGED">Damaged</option>
            <option value="DISCARDED">Discarded</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location *</label>
          <select name="location" className="w-full border rounded px-3 py-2" defaultValue={item.location}>
            <option value="IN_OFFICE">In Office</option>
            <option value="AT_SCHOOL">At School</option>
            <option value="DISCARDED">Discarded</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">School</label>
          <select name="schoolId" className="w-full border rounded px-3 py-2" defaultValue={item.schoolId || ''}>
            <option value="">None</option>
            {schools.map((school: { id: number; name: string }) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={item.notes || ''}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Min Stock Level</label>
          <input
            type="number"
            name="minStockLevel"
            min="0"
            defaultValue={item.minStockLevel || ''}
            className="w-full border rounded px-3 py-2"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Item Tag</label>
          <input
            type="text"
            name="itemTag"
            defaultValue={item.itemTag || ''}
            className="w-full border rounded px-3 py-2"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Last Modified By (Email) *</label>
          <input
            type="email"
            name="lastModifiedBy"
            required
            defaultValue={item.lastModifiedBy}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="text-sm text-gray-500">
          Created: {new Date(item.createdAt).toLocaleString()} | 
          Updated: {new Date(item.updatedAt).toLocaleString()}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Update Device
          </button>
          <Link href="/inventory" className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
