'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ITEM_TYPES = ['UPS', 'KEYBOARD', 'MOUSE', 'CPU', 'SCREEN']

type Device = {
  itemType: string
  quantity: number
}

type CreatedDevice = {
  id: number
  itemName: string
  itemTag: string
}

export default function NewSchoolPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [schoolData, setSchoolData] = useState({
    schoolId: '',
    name: '',
  })
  const [devices, setDevices] = useState<Device[]>([{ itemType: 'UPS', quantity: 1 }])
  const [createdDevices, setCreatedDevices] = useState<CreatedDevice[]>([])

  const handleSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const updateDevice = (index: number, field: keyof Device, value: string | number) => {
    const updated = [...devices]
    updated[index] = { ...updated[index], [field]: value }
    setDevices(updated)
  }

  const addNewRow = () => {
    setDevices([...devices, { itemType: 'UPS', quantity: 1 }])
  }

  const removeDevice = (index: number) => {
    if (devices.length > 1) {
      setDevices(devices.filter((_, i) => i !== index))
    }
  }

  const handleFinalSubmit = async () => {
    const response = await fetch('/api/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school: schoolData,
        devices: devices,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      setCreatedDevices(result.devices || [])
      setStep(3) // Go to success screen
    }
  }

  const resetForm = () => {
    setStep(1)
    setSchoolData({ schoolId: '', name: '' })
    setDevices([{ itemType: 'UPS', quantity: 1 }])
    setCreatedDevices([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏫 Onboard New School</h1>
          <p className="text-gray-600">Add a new school to the system</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="ml-2 font-medium">School Info</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Add Devices</span>
            </div>
          </div>
        </div>

        {/* Step 1: School Information */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">School Information</h2>
            <form onSubmit={handleSchoolSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School ID *
                </label>
                <input
                  type="text"
                  required
                  value={schoolData.schoolId}
                  onChange={(e) => setSchoolData({ ...schoolData, schoolId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SCH001"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for the school</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  value={schoolData.name}
                  onChange={(e) => setSchoolData({ ...schoolData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Lincoln Elementary School"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Continue to Add Devices →
                </button>
                <Link
                  href="/schools"
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Add Devices */}
        {step === 2 && (
          <div className="space-y-6">
            {/* School Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">School Information</h3>
              <div className="text-sm text-blue-800">
                <p><strong>ID:</strong> {schoolData.schoolId}</p>
                <p><strong>Name:</strong> {schoolData.name}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-blue-600 hover:underline text-sm mt-2"
              >
                ← Edit school info
              </button>
            </div>

            {/* Add Devices Table */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add Devices (Optional)</h2>
              <p className="text-gray-600 mb-6">Add devices to be assigned to this school. All devices will be created as WORKING condition with auto-generated tags.</p>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Device Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Preview Tags</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.map((device, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <select
                            value={device.itemType}
                            onChange={(e) => updateDevice(index, 'itemType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            {ITEM_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="1"
                            value={device.quantity}
                            onChange={(e) => updateDevice(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-gray-500 font-mono">
                            {schoolData.schoolId}/{'{id}'}/{device.itemType.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {devices.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDevice(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addNewRow}
                className="mt-4 w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span>
                Add Another Device Type
              </button>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-4">
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  {devices.length > 0 ? `Create School with ${devices.length} Device(s)` : 'Create School (No Devices)'}
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">School Created Successfully!</h2>
              <p className="text-green-800">
                {schoolData.name} has been added to the system
              </p>
            </div>

            {createdDevices.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Created Devices ({createdDevices.length}) with Auto-Generated Tags
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Device Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated Tag
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {createdDevices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {device.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {device.itemName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono">
                            {device.itemTag}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex gap-4">
                <Link
                  href={`/schools`}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition text-center"
                >
                  View All Schools
                </Link>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Add Another School
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition text-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
