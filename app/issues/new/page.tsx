'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function NewIssueForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inventoryId = searchParams.get('inventoryId')

  const [formData, setFormData] = useState({
    inventoryId: inventoryId || '',
    issueType: 'HARDWARE_FAILURE',
    description: '',
    reportedBy: 'Admin',
  })

  const [inventory, setInventory] = useState<any[]>([])
  const [filteredInventory, setFilteredInventory] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // Filters
  const [filterSchool, setFilterSchool] = useState('all')
  const [filterTag, setFilterTag] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/inventory-list').then((res) => res.json()),
      fetch('/api/schools-list').then((res) => res.json()),
    ]).then(([inventoryData, schoolsData]) => {
      setInventory(inventoryData)
      setFilteredInventory(inventoryData)
      setSchools(schoolsData)
      
      if (inventoryId) {
        const item = inventoryData.find((i: any) => i.id.toString() === inventoryId)
        setSelectedItem(item)
        setFormData(prev => ({ ...prev, inventoryId: inventoryId }))
      }
    })
  }, [inventoryId])

  useEffect(() => {
    let filtered = [...inventory]

    // School filter
    if (filterSchool !== 'all') {
      filtered = filtered.filter((item) => item.school?.id.toString() === filterSchool)
    }

    // Tag filter
    if (filterTag) {
      filtered = filtered.filter((item) =>
        item.itemTag?.toLowerCase().includes(filterTag.toLowerCase())
      )
    }

    setFilteredInventory(filtered)
  }, [filterSchool, filterTag, inventory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        inventoryId: parseInt(formData.inventoryId),
        schoolId: selectedItem?.schoolId || null,
      }),
    })

    if (response.ok) {
      router.push('/issues')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚨 Report Issue</h1>
          <p className="text-gray-600">Report a defect or problem with an inventory item</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filter Items</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by School</label>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Schools & Office</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tag</label>
              <input
                type="text"
                placeholder="Type to search tags..."
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {filterTag && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {inventory
                    .filter((item) =>
                      item.itemTag?.toLowerCase().includes(filterTag.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setFilterTag(item.itemTag || '')
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                      >
                        <span className="font-mono text-sm">{item.itemTag}</span>
                        <span className="text-xs text-gray-500">{item.itemName}</span>
                      </button>
                    ))}
                  {inventory.filter((item) =>
                    item.itemTag?.toLowerCase().includes(filterTag.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-2 text-gray-500 text-sm">No tags found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {(filterSchool !== 'all' || filterTag) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredInventory.length} of {inventory.length} items
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterSchool('all')
                  setFilterTag('')
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Item *
              </label>
              <select
                required
                value={formData.inventoryId}
                onChange={(e) => {
                  setFormData({ ...formData, inventoryId: e.target.value })
                  const item = inventory.find((i) => i.id.toString() === e.target.value)
                  setSelectedItem(item)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select an item --</option>
                {filteredInventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} - {item.category} {item.itemTag ? `[${item.itemTag}]` : ''} {item.school ? `(${item.school.name})` : '(In Office)'}
                  </option>
                ))}
              </select>
              {filteredInventory.length === 0 && (
                <p className="text-sm text-orange-600 mt-2">No items match your filters</p>
              )}
            </div>

            {selectedItem && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Selected Item Details</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Item:</strong> {selectedItem.itemName}</p>
                  <p><strong>Category:</strong> {selectedItem.category}</p>
                  <p><strong>Location:</strong> {selectedItem.location.replace('_', ' ')}</p>
                  {selectedItem.school && <p><strong>School:</strong> {selectedItem.school.name}</p>}
                  <p><strong>Condition:</strong> {selectedItem.condition}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="HARDWARE_FAILURE">Hardware Failure</option>
                <option value="SOFTWARE_ISSUE">Software Issue</option>
                <option value="PHYSICAL_DAMAGE">Physical Damage</option>
                <option value="MISSING">Missing</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the issue in detail. What happened? When did it occur? Any error messages?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reported By
              </label>
              <input
                type="text"
                value={formData.reportedBy}
                onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-medium transition"
              >
                Report Issue
              </button>
              <Link
                href="/issues"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NewIssuePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
      <NewIssueForm />
    </Suspense>
  )
}
