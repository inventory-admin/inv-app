'use client'

import { useState } from 'react'
import {
  LOCATIONS,
  LOCATION_LABELS,
  CONDITION_LABELS,
  allowedConditionsForLocation,
  allowedLocationsForCondition,
  statusHint,
} from '@/lib/inventory-status'

interface StatusFieldsProps {
  initialLocation: string
  initialCondition: string
}

// Reactive Condition + Location dropdowns used inside the Edit Device form.
// Renders native <select name="..."> so the parent server-action form submits them.
export default function StatusFields({ initialLocation, initialCondition }: StatusFieldsProps) {
  const [location, setLocation] = useState(initialLocation)
  const [condition, setCondition] = useState(initialCondition)

  const handleLocationChange = (value: string) => {
    const allowed = allowedConditionsForLocation(value)
    setLocation(value)
    if (!allowed.includes(condition as any)) setCondition(allowed[0])
  }

  const handleConditionChange = (value: string) => {
    const allowed = allowedLocationsForCondition(value)
    setCondition(value)
    if (!allowed.includes(location as any)) setLocation(allowed[0])
  }

  const hint = statusHint(location, condition)

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Condition *</label>
        <select
          name="condition"
          className="w-full border rounded px-3 py-2"
          value={condition}
          onChange={(e) => handleConditionChange(e.target.value)}
        >
          {allowedConditionsForLocation(location).map((c) => (
            <option key={c} value={c}>
              {CONDITION_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location *</label>
        <select
          name="location"
          className="w-full border rounded px-3 py-2"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
        >
          {LOCATIONS.filter((l) =>
            allowedLocationsForCondition(condition).includes(l)
          ).map((l) => (
            <option key={l} value={l}>
              {LOCATION_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      {hint && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
          {hint}
        </div>
      )}
    </>
  )
}
