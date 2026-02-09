import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      inventory: {
        orderBy: { itemName: 'asc' },
      },
    },
  })

  if (!school) notFound()

  const working = school.inventory.filter((i: any) => i.location === 'AT_SCHOOL' && i.condition === 'WORKING')
  const broken = school.inventory.filter((i: any) => i.location === 'AT_SCHOOL' && (i.condition === 'NOT_WORKING' || i.condition === 'DAMAGED'))

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/schools" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Schools
        </Link>
        <h1 className="text-3xl font-bold">{school.name}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-gray-600 text-sm">Total Devices</div>
          <div className="text-3xl font-bold">{school.inventory.length}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-gray-600 text-sm">Working</div>
          <div className="text-3xl font-bold text-green-600">{working.length}</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-gray-600 text-sm">Broken</div>
          <div className="text-3xl font-bold text-red-600">{broken.length}</div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Devices at this School</h2>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {school.inventory.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No devices assigned to this school yet
                </td>
              </tr>
            ) : (
              school.inventory.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.itemName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded ${
                      item.condition === 'WORKING'
                        ? 'bg-green-100 text-green-800'
                        : item.condition === 'NOT_WORKING'
                        ? 'bg-red-100 text-red-800'
                        : item.condition === 'DAMAGED'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.condition.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{item.quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
