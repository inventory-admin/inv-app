import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function InventoryHealthDashboard() {
  const [schools, inventory] = await Promise.all([
    prisma.school.findMany({
      include: {
        inventory: {
          select: {
            condition: true,
            category: true,
          },
        },
      },
    }),
    prisma.inventory.findMany({
      select: {
        category: true,
        condition: true,
      },
    }),
  ])

  // Schools with most problems
  const schoolProblems = schools
    .map((school: any) => {
      const defective = school.inventory.filter(
        (item: any) => item.condition === 'NOT_WORKING' || item.condition === 'DAMAGED' || item.condition === 'DISCARDED'
      ).length
      return {
        id: school.id,
        name: school.name,
        total: school.inventory.length,
        defective,
      }
    })
    .filter((s: { defective: number }) => s.defective > 0)
    .sort((a: { defective: number }, b: { defective: number }) => b.defective - a.defective)
    .slice(0, 10)

  // Items with most issues (grouped by category)
  const categoryStats = inventory.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = { total: 0, defective: 0 }
    }
    acc[item.category].total++
    if (item.condition === 'NOT_WORKING' || item.condition === 'DAMAGED' || item.condition === 'DISCARDED') {
      acc[item.category].defective++
    }
    return acc
  }, {} as Record<string, { total: number; defective: number }>)

  const categoryProblems = (Object.entries(categoryStats) as [string, { total: number; defective: number }][])
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      defective: stats.defective,
      percentage: Math.round((stats.defective / stats.total) * 100),
    }))
    .filter((c: { defective: number }) => c.defective > 0)
    .sort((a: { defective: number }, b: { defective: number }) => b.defective - a.defective)

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
                {schoolProblems.map((school: { id: number; name: string; total: number; defective: number }, index: number) => (
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
                        <div className="text-2xl font-bold text-red-600">{school.defective}</div>
                        <div className="text-xs text-gray-500">defective items</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total devices: {school.total}</span>
                      <span>
                        {Math.round((school.defective / school.total) * 100)}% defective
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(school.defective / school.total) * 100}%`,
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
                {categoryProblems.map((cat: { category: string; total: number; defective: number; percentage: number }, index: number) => (
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
                        <div className="text-2xl font-bold text-red-600">{cat.defective}</div>
                        <div className="text-xs text-gray-500">defective</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total: {cat.total} items</span>
                      <span>{cat.percentage}% defective rate</span>
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
                {schoolProblems[0].defective} defective items
              </li>
            )}
            {categoryProblems.length > 0 && (
              <li>
                • Consider reviewing <strong>{categoryProblems[0].category}</strong> procurement as
                it has the highest defect rate ({categoryProblems[0].percentage}%)
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
