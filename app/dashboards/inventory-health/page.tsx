import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Cache configuration - Change this to adjust dashboard update delay
const CACHE_SECONDS = 10

export const dynamic = 'force-dynamic'
export const revalidate = CACHE_SECONDS

export default async function InventoryHealthDashboard() {
  const [schools, inventory] = await Promise.all([
    prisma.school.findMany({
      include: {
        inventory: {
          include: {
            issues: {
              where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
            }
          }
        },
      },
    }),
    prisma.inventory.findMany({
      include: {
        issues: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
        }
      }
    }),
  ])

  // Schools with most problems (defective items + open issues)
  const schoolProblems = schools
    .map((school: any) => {
      const defective = school.inventory.filter(
        (item: any) => item.condition === 'NOT_WORKING' || item.condition === 'DAMAGED' || item.condition === 'DISCARDED'
      ).length
      const withIssues = school.inventory.filter(
        (item: any) => item.issues.length > 0
      ).length
      const totalProblems = Math.max(defective, withIssues) // Avoid double counting
      return {
        id: school.id,
        name: school.name,
        total: school.inventory.length,
        defective,
        withIssues,
        totalProblems,
      }
    })
    .filter((s: { totalProblems: number }) => s.totalProblems > 0)
    .sort((a: { totalProblems: number }, b: { totalProblems: number }) => b.totalProblems - a.totalProblems)
    .slice(0, 10)

  // Items with most issues (grouped by category)
  const categoryStats = inventory.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = { total: 0, defective: 0, withIssues: 0 }
    }
    acc[item.category].total++
    if (item.condition === 'NOT_WORKING' || item.condition === 'DAMAGED' || item.condition === 'DISCARDED') {
      acc[item.category].defective++
    }
    if (item.issues.length > 0) {
      acc[item.category].withIssues++
    }
    return acc
  }, {} as Record<string, { total: number; defective: number; withIssues: number }>)

  const categoryProblems = (Object.entries(categoryStats) as [string, { total: number; defective: number; withIssues: number }][])
    .map(([category, stats]) => {
      const totalProblems = Math.max(stats.defective, stats.withIssues)
      return {
        category,
        total: stats.total,
        defective: stats.defective,
        withIssues: stats.withIssues,
        totalProblems,
        percentage: Math.round((totalProblems / stats.total) * 100),
      }
    })
    .filter((c: { totalProblems: number }) => c.totalProblems > 0)
    .sort((a: { totalProblems: number }, b: { totalProblems: number }) => b.totalProblems - a.totalProblems)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📦 Inventory Health Dashboard</h1>
          <p className="text-gray-600">Identify schools and items with the most problems</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Schools with Most Problems */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">🏫</span>
              Schools with Most Problems
            </h2>

            {schoolProblems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No schools with problems found</p>
            ) : (
              <div className="space-y-4">
                {schoolProblems.map((school: { id: number; name: string; total: number; defective: number; totalProblems: number; withIssues: number }, index: number) => (
                  <div key={school.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-xl font-bold ${
                            index === 0
                              ? 'text-red-600'
                              : index === 1
                              ? 'text-orange-600'
                              : index === 2
                              ? 'text-yellow-600'
                              : 'text-gray-500'
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <Link
                          href={`/schools/${school.id}`}
                          className="text-lg font-semibold text-gray-800 hover:text-blue-600"
                        >
                          {school.name}
                        </Link>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{school.totalProblems}</div>
                        <div className="text-xs text-gray-500">items with problems</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total devices: {school.total}</span>
                      <span>
                        {Math.round((school.totalProblems / school.total) * 100)}% with problems
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {school.defective} defective • {school.withIssues} with open issues
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(school.totalProblems / school.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items with Most Issues */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">📱</span>
              Items with Most Issues
            </h2>

            {categoryProblems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items with issues found</p>
            ) : (
              <div className="space-y-4">
                {categoryProblems.map((cat: { category: string; total: number; defective: number; percentage: number; totalProblems: number; withIssues: number }, index: number) => (
                  <div key={cat.category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-xl font-bold ${
                            index === 0
                              ? 'text-red-600'
                              : index === 1
                              ? 'text-orange-600'
                              : index === 2
                              ? 'text-yellow-600'
                              : 'text-gray-500'
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div className="text-lg font-semibold text-gray-800">{cat.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{cat.totalProblems}</div>
                        <div className="text-xs text-gray-500">with problems</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total: {cat.total} items</span>
                      <span>{cat.percentage}% problem rate</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {cat.defective} defective • {cat.withIssues} with open issues
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          cat.percentage >= 50
                            ? 'bg-red-500'
                            : cat.percentage >= 25
                            ? 'bg-orange-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">💡 Insights & Recommendations</h3>
          <ul className="space-y-2 text-blue-800">
            {schoolProblems.length > 0 && (
              <li>
                • Focus maintenance efforts on <strong>{schoolProblems[0].name}</strong> which has{' '}
                {schoolProblems[0].totalProblems} items with problems
              </li>
            )}
            {categoryProblems.length > 0 && (
              <li>
                • Consider reviewing <strong>{categoryProblems[0].category}</strong> procurement as
                it has the highest problem rate ({categoryProblems[0].percentage}%)
              </li>
            )}
            {schoolProblems.length === 0 && categoryProblems.length === 0 && (
              <li>• All inventory is in good condition! Keep up the excellent maintenance work.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
