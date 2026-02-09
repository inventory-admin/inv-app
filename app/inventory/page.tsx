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
  itemId: string | null
  school: {
    id: number
    name: string
  } | null
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterCondition, setFilterCondition] = useState('all')
  const [filterSchool, setFilterSchool] = useState('all')

  useEffect(() => {
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.itemId?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === filterCategory)
    }

    // Location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter((item) => item.location === filterLocation)
    }

    // Condition filter
    if (filterCondition !== 'all') {
      filtered = filtered.filter((item) => item.condition === filterCondition)
    }

    // School filter
    if (filterSchool !== 'all') {
      filtered = filtered.filter((item) => item.school?.id.toString() === filterSchool)
    }

    setFilteredItems(filtered)
  }, [searchTerm, filterCategory, filterLocation, filterCondition, filterSchool, items])

  // Calculate statistics
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const workingItems = items.filter((item) => item.condition === 'WORKING').reduce((sum, item) => sum + item.quantity, 0)
  const notWorkingItems = items.filter((item) => item.condition === 'NOT_WORKING' || item.condition === 'DAMAGED' || item.condition === 'DISCARDED').reduce((sum, item) => sum + item.quantity, 0)
  const atSchools = items.filter((item) => item.location === 'AT_SCHOOL').reduce((sum, item) => sum + item.quantity, 0)
  const inOffice = items.filter((item) => item.location === 'IN_OFFICE').reduce((sum, item) => sum + item.quantity, 0)

  // Define categories from enum
  const categories = ['UPS', 'KEYBOARD', 'MOUSE', 'CPU', 'SCREEN']

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📦 All Inventory</h1>
              <p className="text-gray-600">Manage and track all devices across your organization</p>
            </div>
            <Link
              href="/inventory/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition"
            >
              ➕ Add Device
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Total Devices</div>
            <div className="text-4xl font-bold text-blue-600">{totalItems}</div>
            <div className="text-xs text-gray-500 mt-1">{items.length} unique items</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Working Devices</div>
            <div className="text-4xl font-bold text-green-600">{workingItems}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalItems > 0 ? Math.round((workingItems / totalItems) * 100) : 0}% of total
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="text-gray-500 text-sm font-medium mb-2">Not Working</div>
            <div className="text-4xl font-bold text-red-600">{notWorkingItems}</div>
            <div className="text-xs text-gray-500 mt-1">Need attention</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="text-gray-500 text-sm font-medium mb-2">At Schools</div>
            <div className="text-4xl font-bold text-purple-600">{atSchools}</div>
            <div className="text-xs text-gray-500 mt-1">{inOffice} in office</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filters & Search</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, tag, category, school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Categories</option>
                <option value="UPS">UPS</option>
                <option value="KEYBOARD">Keyboard</option>
                <option value="MOUSE">Mouse</option>
                <option value="CPU">CPU</option>
                <option value="SCREEN">Screen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Locations</option>
                <option value="IN_OFFICE">In Office</option>
                <option value="AT_SCHOOL">At School</option>
                <option value="DISCARDED">Discarded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Conditions</option>
                <option value="WORKING">Working</option>
                <option value="NOT_WORKING">Not Working</option>
                <option value="DAMAGED">Damaged</option>
                <option value="DISCARDED">Discarded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchTerm || filterCategory !== 'all' || filterLocation !== 'all' || filterCondition !== 'all' || filterSchool !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredItems.length} of {items.length} items
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('all')
                  setFilterLocation('all')
                  setFilterCondition('all')
                  setFilterSchool('all')
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              Inventory Items ({filteredItems.length})
            </h2>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No items found matching your filters</p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('all')
                  setFilterLocation('all')
                  setFilterCondition('all')
                  setFilterSchool('all')
                }}
                className="mt-4 text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 font-mono">{item.itemId || '-'}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.location.replace('_', ' ')}
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
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/inventory/${item.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>
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
