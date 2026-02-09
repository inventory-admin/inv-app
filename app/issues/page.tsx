import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function IssuesPage() {
  const issues = await prisma.issue.findMany({
    include: {
      inventory: true,
      school: true,
    },
    orderBy: { reportedAt: 'desc' },
  })

  const openIssues = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS')
  const resolvedIssues = issues.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📋 All Issues</h1>
            <p className="text-gray-600">Track and manage reported issues</p>
          </div>
          <Link
            href="/issues/new"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium transition"
          >
            Report New Issue
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-orange-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Open Issues</div>
            <div className="text-4xl font-bold text-orange-600">{openIssues.length}</div>
            <div className="text-xs text-gray-500 mt-1">Requiring attention</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Resolved Issues</div>
            <div className="text-4xl font-bold text-green-600">{resolvedIssues.length}</div>
            <div className="text-xs text-gray-500 mt-1">Successfully resolved</div>
          </div>
        </div>

        {/* Open Issues */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Open Issues</h2>
          </div>

          {openIssues.length === 0 ? (
            <p className="text-gray-500 text-center py-12">
              No open issues. Great job! 🎉
            </p>
          ) : (
            <div className="divide-y divide-gray-200">
              {openIssues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            issue.status === 'OPEN'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {issue.status.replace('_', ' ')}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {issue.issueType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Link
                        href={`/inventory/${issue.inventory.id}`}
                        className="text-lg font-bold text-gray-800 hover:text-blue-600"
                      >
                        {issue.inventory.itemName}
                      </Link>
                      <div className="text-sm text-gray-600 mt-1">
                        {issue.inventory.category}
                        {issue.school && (
                          <>
                            {' • '}
                            <Link
                              href={`/schools/${issue.school.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {issue.school.name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(issue.reportedAt).toLocaleDateString()}</div>
                      <div className="text-xs">by {issue.reportedBy}</div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{issue.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Issues */}
        {resolvedIssues.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Resolved Issues</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {resolvedIssues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-gray-50 opacity-75">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {issue.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {issue.issueType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Link
                        href={`/inventory/${issue.inventory.id}`}
                        className="text-lg font-bold text-gray-800 hover:text-blue-600"
                      >
                        {issue.inventory.itemName}
                      </Link>
                      <div className="text-sm text-gray-600 mt-1">
                        {issue.inventory.category}
                        {issue.school && (
                          <>
                            {' • '}
                            <Link
                              href={`/schools/${issue.school.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {issue.school.name}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Reported: {new Date(issue.reportedAt).toLocaleDateString()}</div>
                      {issue.resolvedAt && (
                        <div className="text-green-600">
                          Resolved: {new Date(issue.resolvedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
