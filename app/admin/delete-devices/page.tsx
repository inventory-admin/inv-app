'use client'

import { useEffect, useState } from 'react'
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

export default function AdminDeleteDevicesPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [filterSchool, setFilterSchool] = useState('all')
  const [filterTag, setFilterTag] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/inventory-list').then((res) => res.json()),
      fetch('/api/schools-list').then((res) => res.json()),
    ]).then(([inventoryData, schoolsData]) => {
      const invArray = Array.isArray(inventoryData) ? inventoryData : []
      const schArray = Array.isArray(schoolsData) ? schoolsData : []
      setItems(invArray)
      setFilteredItems(invArray)
      setSchools(schArray)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    let filtered = [...items]
    if (filterSchool !== 'all') {
      filtered = filtered.filter((item) => item.school?.id.toString() === filterSchool)
    }
    if (filterTag) {
      filtered = filtered.filter((item) =>
        item.itemTag?.toLowerCase().includes(filterTag.toLowerCase()) ||
        item.itemName.toLowerCase().includes(filterTag.toLowerCase())
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

  const handleDelete = async () => {
    if (selectedItems.size === 0 || !confirmDelete) return

    const response = await fetch('/api/admin/delete-devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIds: Array.from(selectedItems) }),
    })

    if (response.ok) {
      const data = await response.json()
      alert(`Successfully deleted ${data.deleted} device(s).`)
      // Refresh
      setItems(items.filter((item) => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      setConfirmDelete(false)
    } else {
      const data = await response.json()
      alert(data.error || 'Failed to delete devices')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🗑️ Admin: Delete Devices</h1>
          <p className="text-gray-600">Permanently remove devices from the system. This action cannot be undone.</p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-800 text-sm font-medium">
            ⚠️ This is an admin action. Deleted devices are permanently removed from the database along with their issue history.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by School</label>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by tag or name</label>
              <input
                type="text"
                placeholder="Search..."
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Delete Panel */}
        {selectedItems.size > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-red-900 mb-3">
              Delete {selectedItems.size} device(s)?
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="confirmDelete"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded"
              />
              <label htmlFor="confirmDelete" className="text-sm text-red-800">
                I understand this is permanent and cannot be undone
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={!confirmDelete}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Permanently Delete
              </button>
              <button
                onClick={() => { setSelectedItems(new Set()); setConfirmDelete(false) }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Devices ({filteredItems.length})
            </h2>
          </div>

          {isLoading ? (
            <p className="p-6 text-gray-500">Loading...</p>
          ) : filteredItems.length === 0 ? (
            <p className="p-6 text-gray-500">No devices found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tag</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${selectedItems.has(item.id) ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.itemTag || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.school?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.condition.replace('_', ' ')} / {item.location.replace('_', ' ')}
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
