import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Cache configuration - Change this to adjust dashboard update delay
const CACHE_SECONDS = 10

export const dynamic = 'force-dynamic'
export const revalidate = CACHE_SECONDS

export default async function MaintenanceDashboard() {
  // Get items with defective conditions
  const defectiveItems = await prisma.inventory.findMany({
    where: {
      condition: 'NOT_WORKING',
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

  // Get items with open issues (regardless of condition)
  const itemsWithIssues = await prisma.inventory.findMany({
    where: {
      issues: {
        some: {
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      }
    },
    include: {
      school: true,
      issues: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: { reportedAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Combine and deduplicate items
  const allMaintenanceItems = [...defectiveItems]
  itemsWithIssues.forEach(item => {
    if (!allMaintenanceItems.find(existing => existing.id === item.id)) {
      allMaintenanceItems.push(item)
    }
  })

  const notWorkingItems = allMaintenanceItems.filter((item: any) => 
    item.condition === 'NOT_WORKING'
  )
  const itemsWithOpenIssues = allMaintenanceItems.filter((item: any) => 
    item.issues.some((issue: any) => ['OPEN', 'IN_PROGRESS'].includes(issue.status))
  )

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
            <div className="text-gray-500 text-sm font-medium mb-2">Not Working</div>
            <div className="text-4xl font-bold text-red-600">{notWorkingItems.length}</div>
            <div className="text-xs text-gray-500 mt-1">Devices needing repair</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Open Issues</div>
            <div className="text-4xl font-bold text-yellow-600">{itemsWithOpenIssues.length}</div>
            <div className="text-xs text-gray-500 mt-1">Items with reported issues</div>
          </div>
        </div>

        {/* Maintenance Items List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Items Requiring Attention</h2>
          </div>

          {allMaintenanceItems.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No items requiring maintenance. All devices are in good condition! 🎉
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
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allMaintenanceItems.map((item: any) => {
                    const openIssues = item.issues.filter((issue: any) => ['OPEN', 'IN_PROGRESS'].includes(issue.status))
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
                            <span className="text-gray-400">Office</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.condition === 'WORKING'
                                ? 'bg-green-100 text-green-800'
                                : item.condition === 'NOT_WORKING'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {item.condition.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {openIssues.length > 0 ? (
                            <div>
                              <div className="font-medium text-red-600">
                                {openIssues.length} open issue{openIssues.length > 1 ? 's' : ''}
                              </div>
                              <div className="text-xs text-gray-400">
                                Latest: {latestIssue.issueType.replace(/_/g, ' ')}
                              </div>
                            </div>
                          ) : latestIssue ? (
                            <div>
                              <div className="font-medium">{latestIssue.issueType.replace(/_/g, ' ')}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(latestIssue.reportedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Defective condition only</span>
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
