'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type School = {
  id: number
  name: string
  inventory: {
    condition: string
    location: string
  }[]
}

type SchoolStats = {
  id: number
  name: string
  total: number
  working: number
  defective: number
  healthScore: number
  status: 'healthy' | 'moderate' | 'critical'
  atSchool: number
  inOffice: number
}

export default function SchoolHealthDashboard() {
  const [schools, setSchools] = useState<School[]>([])
  const [schoolStats, setSchoolStats] = useState<SchoolStats[]>([])
  const [filteredStats, setFilteredStats] = useState<SchoolStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'health' | 'name' | 'problems'>('health')
  const [showAll, setShowAll] = useState(true)

  useEffect(() => {
    fetch('/api/schools-list')
      .then((res) => res.json())
      .then((data: School[]) => {
        setSchools(data)
        
        const stats = data.map((school: School) => {
          const items = school.inventory.filter((item: any) => item.location === 'AT_SCHOOL')
          const total = items.length
          const working = items.filter((item: any) => item.condition === 'WORKING').length
          const defective = total - working
          const healthScore = total > 0 ? Math.round((working / total) * 100) : 100
          
          let status: 'healthy' | 'moderate' | 'critical'
          if (healthScore >= 80) status = 'healthy'
          else if (healthScore >= 50) status = 'moderate'
          else status = 'critical'

          return {
            id: school.id,
            name: school.name,
            total,
            working,
            defective,
            healthScore,
            status,
            atSchool: items.length,
            inOffice: school.inventory.filter((item: any) => item.location === 'IN_OFFICE').length,
          }
        })

        setSchoolStats(stats)
        setFilteredStats(stats)
      })
  }, [])

  useEffect(() => {
    let filtered = [...schoolStats]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((school) =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    if (sortBy === 'health') {
      filtered.sort((a, b) => a.healthScore - b.healthScore)
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'problems') {
      filtered.sort((a, b) => b.defective - a.defective)
    }

    // Apply "Show All" filter
    if (!showAll) {
      filtered = filtered.filter((s) => s.defective > 0)
    }

    setFilteredStats(filtered)
  }, [searchTerm, sortBy, showAll, schoolStats])

  const healthyCount = schoolStats.filter((s) => s.status === 'healthy').length
  const moderateCount = schoolStats.filter((s) => s.status === 'moderate').length
  const criticalCount = schoolStats.filter((s) => s.status === 'critical').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏫 School Health Dashboard</h1>
          <p className="text-gray-600">Monitor school device health and manage school operations</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Total Schools</div>
            <div className="text-4xl font-bold text-blue-600">{schoolStats.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Healthy Schools</div>
            <div className="text-4xl font-bold text-green-600">{healthyCount}</div>
            <div className="text-xs text-gray-500 mt-1">≥80% working devices</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Moderate Schools</div>
            <div className="text-4xl font-bold text-yellow-600">{moderateCount}</div>
            <div className="text-xs text-gray-500 mt-1">50-79% working devices</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Critical Schools</div>
            <div className="text-4xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-xs text-gray-500 mt-1">&lt;50% working devices</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by School</label>
              <input
                type="text"
                placeholder="Type to search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {schoolStats
                    .filter((school) =>
                      school.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((school) => (
                      <button
                        key={school.id}
                        onClick={() => {
                          setSearchTerm(school.name)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                      >
                        <span className="font-medium">{school.name}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            school.status === 'healthy'
                              ? 'bg-green-100 text-green-800'
                              : school.status === 'moderate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {school.healthScore}%
                        </span>
                      </button>
                    ))}
                  {schoolStats.filter((school) =>
                    school.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">No schools found</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="health">Health Score (Low to High)</option>
                <option value="problems">Most Problems</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <button
                onClick={() => setShowAll(!showAll)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  showAll
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showAll ? 'Show All' : 'Problems Only'}
              </button>
            </div>
          </div>
        </div>

        {/* Schools List */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Schools ({filteredStats.length})
          </h2>

          {filteredStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'No schools found matching your search' : 'No schools found'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredStats.map((school) => (
                <div
                  key={school.id}
                  className="border rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link
                        href={`/schools/${school.id}`}
                        className="text-xl font-bold text-gray-800 hover:text-blue-600"
                      >
                        {school.name}
                      </Link>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>Total Devices: {school.total}</span>
                        <span className="text-green-600">Working: {school.working}</span>
                        <span className="text-red-600">Defective: {school.defective}</span>
                      </div>
                      <div className="flex gap-2 mt-2 text-xs text-gray-500">
                        <span>At School: {school.atSchool}</span>
                        <span>•</span>
                        <span>In Office: {school.inOffice}</span>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        school.status === 'healthy'
                          ? 'bg-green-100 text-green-800'
                          : school.status === 'moderate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {school.healthScore}% Healthy
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        school.status === 'healthy'
                          ? 'bg-green-500'
                          : school.status === 'moderate'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${school.healthScore}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
