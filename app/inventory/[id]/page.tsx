import { prisma } from '@/lib/prisma'
import { updateInventory } from '../actions'
import StatusFields from '../StatusFields'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditInventoryPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const item = await prisma.inventory.findUnique({ where: { id } })
  
  if (!item) notFound()

  const [schools, openIssues, allIssues] = await Promise.all([
    prisma.school.findMany({ orderBy: { name: 'asc' } }),
    prisma.issue.findMany({
      where: {
        inventoryId: id,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    }),
    prisma.issue.findMany({
      where: { inventoryId: id },
      include: { school: true },
      orderBy: { reportedAt: 'desc' },
    }),
  ])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Device #{item.id}</h1>

      {openIssues.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm font-medium">
            ⚠️ This device has {openIssues.length} open issue{openIssues.length > 1 ? 's' : ''}.
            Consider using the{' '}
            <Link href="/issues" className="text-blue-600 hover:underline font-semibold">
              Issues Dashboard
            </Link>{' '}
            to resolve them.
          </p>
        </div>
      )}

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
          <select
            name="category"
            required
            defaultValue={item.category}
            className="w-full border rounded px-3 py-2"
          >
            <option value="UPS">UPS</option>
            <option value="KEYBOARD">Keyboard</option>
            <option value="MOUSE">Mouse</option>
            <option value="CPU">CPU</option>
            <option value="SCREEN">Screen</option>
            <option value="POWER_ADAPTOR">Power Adaptor</option>
            <option value="WIFI_RECEIVER">Wifi Receiver</option>
            <option value="THREE_PIN">3 Pin</option>
            <option value="VGA_CABLE">VGA Cable</option>
            <option value="HDMI_CABLE">HDMI Cable</option>
          </select>
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

        <StatusFields initialLocation={item.location} initialCondition={item.condition} />

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

      {/* Issue History */}
      <div id="history" className="bg-white shadow rounded-lg p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">📋 Issue History ({allIssues.length})</h2>
        {allIssues.length === 0 ? (
          <p className="text-gray-500 text-sm">No issues have been reported for this device.</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {allIssues.map((issue: any) => (
              <div key={issue.id} className="py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        issue.status === 'OPEN' ? 'bg-orange-100 text-orange-800' :
                        issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {issue.issueType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{issue.description}</p>
                    {issue.school && (
                      <p className="text-xs text-gray-500 mt-1">School: {issue.school.name}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 whitespace-nowrap ml-4">
                    <div>Reported: {new Date(issue.reportedAt).toLocaleDateString()}</div>
                    <div>by {issue.reportedBy}</div>
                    {issue.resolvedAt && (
                      <div className="text-green-600">Resolved: {new Date(issue.resolvedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
