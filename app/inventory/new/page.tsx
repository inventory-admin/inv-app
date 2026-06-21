'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LOCATIONS,
  LOCATION_LABELS,
  CONDITION_LABELS,
  allowedConditionsForLocation,
  allowedLocationsForCondition,
  statusHint,
} from '@/lib/inventory-status'

export default function NewInventoryPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'UPS',
    quantity: 1,
    condition: 'WORKING',
    location: 'IN_OFFICE',
    notes: '',
    lastModifiedBy: 'Admin',
  })

  // When location changes, keep condition valid for the new location
  const handleLocationChange = (location: string) => {
    const allowed = allowedConditionsForLocation(location)
    setFormData((prev) => ({
      ...prev,
      location,
      condition: allowed.includes(prev.condition as any) ? prev.condition : allowed[0],
    }))
  }

  // When condition changes, keep location valid for the new condition
  const handleConditionChange = (condition: string) => {
    const allowed = allowedLocationsForCondition(condition)
    setFormData((prev) => ({
      ...prev,
      condition,
      location: allowed.includes(prev.location as any) ? prev.location : allowed[0],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      router.push('/inventory')
      router.refresh()
    } else {
      const data = await response.json()
      setError(data.error || 'Failed to add device')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">➕ Onboard New Inventory</h1>
          <p className="text-gray-600">Add new devices to your inventory</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Laptop Dell Latitude 5420"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="UPS">UPS</option>
                <option value="KEYBOARD">Keyboard</option>
                <option value="MOUSE">Mouse</option>
                <option value="CPU">CPU</option>
                <option value="SCREEN">Screen</option>
                <option value="POWER_ADAPTOR">Power Adaptor</option>
                <option value="WIFI_RECEIVER">Wifi Receiver</option>
                <option value="THREE_PIN">3 Pin</option>
                <option value="VGA_CABLE">VGA Cable</option>
                <option value="HDMI_CABLE">HDMI Cable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Tags will be auto-generated</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleConditionChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {allowedConditionsForLocation(formData.location).map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LOCATIONS.filter((l) =>
                    allowedLocationsForCondition(formData.condition).includes(l)
                  ).map((l) => (
                    <option key={l} value={l}>
                      {LOCATION_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {statusHint(formData.location, formData.condition) && (
              <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                {statusHint(formData.location, formData.condition)}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional information about this inventory item..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Add to Inventory
              </button>
              <Link
                href="/inventory"
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
