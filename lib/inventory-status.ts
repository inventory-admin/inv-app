// Shared Location x Condition matrix, labels, validation, and status hints.
// This is the single source of truth for valid device states.

export type LocationValue = 'IN_OFFICE' | 'AT_SCHOOL' | 'VENDOR' | 'DISCARDED'
export type ConditionValue = 'WORKING' | 'NOT_WORKING' | 'DISCARDED'

export const LOCATION_LABELS: Record<LocationValue, string> = {
  IN_OFFICE: 'In Office',
  AT_SCHOOL: 'At School',
  VENDOR: 'At Vendor',
  DISCARDED: 'Discarded',
}

export const CONDITION_LABELS: Record<ConditionValue, string> = {
  WORKING: 'Working',
  NOT_WORKING: 'Not Working',
  DISCARDED: 'Discarded',
}

export const LOCATIONS: LocationValue[] = ['IN_OFFICE', 'AT_SCHOOL', 'VENDOR', 'DISCARDED']
export const CONDITIONS: ConditionValue[] = ['WORKING', 'NOT_WORKING', 'DISCARDED']

// A combination is valid when:
// - DISCARDED is terminal: location DISCARDED <=> condition DISCARDED (both together)
// - Any active location (office/school/vendor) pairs only with WORKING or NOT_WORKING
export function isValidCombo(location: string, condition: string): boolean {
  if (location === 'DISCARDED' || condition === 'DISCARDED') {
    return location === 'DISCARDED' && condition === 'DISCARDED'
  }
  return (
    (location === 'IN_OFFICE' || location === 'AT_SCHOOL' || location === 'VENDOR') &&
    (condition === 'WORKING' || condition === 'NOT_WORKING')
  )
}

// Conditions allowed for a given location (used to filter the Condition dropdown)
export function allowedConditionsForLocation(location: string): ConditionValue[] {
  if (location === 'DISCARDED') return ['DISCARDED']
  return ['WORKING', 'NOT_WORKING']
}

// Locations allowed for a given condition (used to filter the Location dropdown)
export function allowedLocationsForCondition(condition: string): LocationValue[] {
  if (condition === 'DISCARDED') return ['DISCARDED']
  return ['IN_OFFICE', 'AT_SCHOOL', 'VENDOR']
}

// Short action cue shown in the UI when a valid combo is selected.
export function statusHint(location: string, condition: string): string | null {
  const key = `${location}|${condition}`
  const hints: Record<string, string> = {
    'AT_SCHOOL|WORKING': 'No action needed',
    'AT_SCHOOL|NOT_WORKING': 'Report issue immediately',
    'IN_OFFICE|WORKING': 'Ready for deployment',
    'IN_OFFICE|NOT_WORKING': 'Send to vendor / repair',
    'VENDOR|NOT_WORKING': 'Monitor, await return',
    'VENDOR|WORKING': 'Repaired — collect & move to office',
    'DISCARDED|DISCARDED': 'No further action',
  }
  return hints[key] || null
}
