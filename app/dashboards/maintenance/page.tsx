import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function MaintenanceDashboard() {
  const defectiveItems = await prisma.inventory.findMany({
    where: {
      OR: [
        { condition: 'NOT_WORKING' },
        { condition: 'DAMAGED' },
        { condition: 'DISCARDED' },
      ],
    },
    include: {
      school: true,
      issues: {
        orderBy: { reportedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const criticalItems = defectiveItems.filter((item) => item.condition === 'NOT_WORKING')
  const damagedItems = defectiveItems.filter((item) => item.condition === 'DAMAGED')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔧 Maintenance Dashboard</h1>
          <p className="text-gray-600">Track all defective items requiring attention</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Critical (Not Working)</div>
            <div className="text-4xl font-bold text-red-600">{criticalItems.length}</div>
            <div className="text-xs text-gray-500 mt-1">Requires immediate attention</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-orange-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Damaged (Still Working)</div>
            <div className="text-4xl font-bold text-orange-600">{damagedItems.length}</div>
            <div className="text-xs text-gray-500 mt-1">Monitor for degradation</div>
          </div>
        </div>

        {/* Defective Items List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">All Defective Items</h2>
          </div>

          {defectiveItems.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No defective items found. All devices are in good condition! 🎉
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest Issue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {defectiveItems.map((item) => {
                    const latestIssue = item.issues[0]
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                          {item.itemId && (
                            <div className="text-xs text-gray-500">ID: {item.itemId}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.school ? (
                            <Link
                              href={`/schools/${item.school.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {item.school.name}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.condition === 'WORKING'
                                ? 'bg-green-100 text-green-800'
                                : item.condition === 'NOT_WORKING'
                                ? 'bg-red-100 text-red-800'
                                : item.condition === 'DAMAGED'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item.condition.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {latestIssue ? (
                            <div>
                              <div className="font-medium">{latestIssue.issueType.replace(/_/g, ' ')}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(latestIssue.reportedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No issues reported</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
