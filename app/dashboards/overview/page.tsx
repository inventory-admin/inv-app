import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function OverviewDashboard() {
  const [schools, inventory] = await Promise.all([
    prisma.school.count(),
    prisma.inventory.findMany({
      select: {
        condition: true,
        location: true,
      },
    }),
  ])

  const totalItems = inventory.length
  const healthyItems = inventory.filter(
    (item: any) => item.condition === 'WORKING'
  ).length
  const defectiveItems = inventory.filter(
    (item: any) => item.condition === 'NOT_WORKING' || item.condition === 'DAMAGED' || item.condition === 'DISCARDED'
  ).length

  const atSchools = inventory.filter((item: any) => item.location === 'AT_SCHOOL').length
  const inOffice = inventory.filter((item: any) => item.location === 'IN_OFFICE').length
  const discarded = inventory.filter((item: any) => item.location === 'DISCARDED').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📈 Overview Dashboard</h1>
          <p className="text-gray-600">Key metrics and totals</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Total Schools</div>
            <div className="text-4xl font-bold text-gray-800">{schools}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Total Inventory</div>
            <div className="text-4xl font-bold text-gray-800">{totalItems}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Healthy Items</div>
            <div className="text-4xl font-bold text-green-600">{healthyItems}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalItems > 0 ? Math.round((healthyItems / totalItems) * 100) : 0}% of total
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Defective Items</div>
            <div className="text-4xl font-bold text-red-600">{defectiveItems}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalItems > 0 ? Math.round((defectiveItems / totalItems) * 100) : 0}% of total
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Items by Location</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">At Schools</span>
                <span className="font-bold text-gray-800">{atSchools} items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full"
                  style={{ width: `${totalItems > 0 ? (atSchools / totalItems) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {totalItems > 0 ? Math.round((atSchools / totalItems) * 100) : 0}%
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">In Office</span>
                <span className="font-bold text-gray-800">{inOffice} items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${totalItems > 0 ? (inOffice / totalItems) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {totalItems > 0 ? Math.round((inOffice / totalItems) * 100) : 0}%
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">Discarded</span>
                <span className="font-bold text-gray-800">{discarded} items</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gray-400 h-4 rounded-full"
                  style={{ width: `${totalItems > 0 ? (discarded / totalItems) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {totalItems > 0 ? Math.round((discarded / totalItems) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
