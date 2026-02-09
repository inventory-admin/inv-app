'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type InventoryItem = {
  id: number
  itemName: string
  category: string
  quantity: number
  condition: string
  location: string
  itemTag: string | null
  school: {
    id: number
    name: string
  } | null
}

export default function UpdateInventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [schools, setSchools] = useState<any[]>([])
  
  // Filters
  const [filterSchool, setFilterSchool] = useState('all')
  const [filterTag, setFilterTag] = useState('')
  
  // Selected items for bulk update
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  
  // Bulk update values
  const [bulkUpdate, setBulkUpdate] = useState({
    location: '',
    condition: '',
  })

  useEffect(() => {
    // Fetch inventory and schools
    Promise.all([
      fetch('/api/inventory-list').then((res) => res.json()),
      fetch('/api/schools-list').then((res) => res.json()),
    ]).then(([inventoryData, schoolsData]) => {
      setItems(inventoryData)
      setFilteredItems(inventoryData)
      setSchools(schoolsData)
    })
  }, [])

  useEffect(() => {
    let filtered = [...items]

    // School filter
    if (filterSchool !== 'all') {
      filtered = filtered.filter((item) => 
        item.school?.id.toString() === filterSchool
      )
    }

    // Tag filter
    if (filterTag) {
      filtered = filtered.filter((item) =>
        item.itemTag?.toLowerCase().includes(filterTag.toLowerCase())
      )
    }

    setFilteredItems(filtered)
  }, [filterSchool, filterTag, items])

  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedItems(newSelection)
  }

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)))
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedItems.size === 0) return

    const updates = {
      itemIds: Array.from(selectedItems),
      ...bulkUpdate,
    }

    const response = await fetch('/api/inventory/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (response.ok) {
      // Refresh data
      const data = await fetch('/api/inventory-list').then((res) => res.json())
      setItems(data)
      setSelectedItems(new Set())
      setBulkUpdate({ location: '', condition: '' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔄 Update Inventory</h1>
          <p className="text-gray-600">Update status and location of inventory items</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filter Items</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by School</label>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tag</label>
              <input
                type="text"
                placeholder="Search by tag..."
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {(filterSchool !== 'all' || filterTag) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredItems.length} of {items.length} items
              </p>
              <button
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

        {/* Bulk Update Panel */}
        {selectedItems.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              Bulk Update ({selectedItems.size} items selected)
            </h3>
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Update Location</label>
                <select
                  value={bulkUpdate.location}
                  onChange={(e) => setBulkUpdate({ ...bulkUpdate, location: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg"
                >
                  <option value="">-- No Change --</option>
                  <option value="IN_OFFICE">In Office</option>
                  <option value="AT_SCHOOL">At School</option>
                  <option value="DISCARDED">Discarded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">Update Condition</label>
                <select
                  value={bulkUpdate.condition}
                  onChange={(e) => setBulkUpdate({ ...bulkUpdate, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg"
                >
                  <option value="">-- No Change --</option>
                  <option value="WORKING">Working</option>
                  <option value="NOT_WORKING">Not Working</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="DISCARDED">Discarded</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBulkUpdate}
                disabled={!bulkUpdate.location && !bulkUpdate.condition}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply Updates
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Inventory Items ({filteredItems.length})
            </h2>
            <button
              onClick={selectAll}
              className="text-blue-600 hover:underline font-medium"
            >
              {selectedItems.size === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No items found matching your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50 ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.itemTag || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.school?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.location.replace('_', ' ')}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
