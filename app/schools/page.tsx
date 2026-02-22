import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Cache configuration - Change this to adjust dashboard update delay
const CACHE_SECONDS = 10

export const dynamic = 'force-dynamic'
export const revalidate = CACHE_SECONDS

export default async function SchoolsPage() {
  const schools = await prisma.school.findMany({
    include: {
      inventory: {
        include: {
          issues: {
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
          }
        }
      },
    },
    orderBy: { name: 'asc' },
  })

  const schoolsWithStats = schools.map((school) => {
    const itemsWithIssues = school.inventory.filter((i) => i.issues.length > 0).length
    return {
      ...school,
      total: school.inventory.length,
      working: school.inventory.filter((i) => i.location === 'AT_SCHOOL' && i.condition === 'WORKING').length,
      broken: school.inventory.filter((i) => i.location === 'AT_SCHOOL' && (i.condition === 'NOT_WORKING' || i.condition === 'DAMAGED')).length,
      withIssues: itemsWithIssues,
    }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Schools</h1>
        <Link
          href="/schools/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add School
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schoolsWithStats.map((school) => (
          <Link
            key={school.id}
            href={`/schools/${school.id}`}
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-bold mb-4">{school.name}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Devices:</span>
                <span className="font-semibold">{school.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Working:</span>
                <span className="font-semibold text-green-600">{school.working}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Broken:</span>
                <span className="font-semibold text-red-600">{school.broken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">With Issues:</span>
                <span className="font-semibold text-orange-600">{school.withIssues}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
