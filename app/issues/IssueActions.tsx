'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface IssueActionsProps {
  issueId: number
  inventoryItemName: string
  itemTag: string | null
}

type ActionType = 'resolve' | 'discard_replace' | 'discard'

export default function IssueActions({ issueId, inventoryItemName, itemTag }: IssueActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<ActionType | null>(null)

  async function handleAction(action: ActionType) {
    setLoading(true)
    setActiveAction(action)

    try {
      const res = await fetch('/api/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, action }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 409) {
          alert(data.error || 'Conflict: tag uniqueness violation')
        } else if (res.status === 404) {
          alert(data.error || 'Issue not found')
        } else {
          alert(data.error || 'An error occurred')
        }
        return
      }

      router.refresh()
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
      setActiveAction(null)
    }
  }

  return (
    <div className="flex flex-row gap-2 mt-2">
      <button
        onClick={() => handleAction('resolve')}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {activeAction === 'resolve' ? '...' : '✅ Resolve'}
      </button>
      <button
        onClick={() => handleAction('discard_replace')}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {activeAction === 'discard_replace' ? '...' : '🔄 Replace'}
      </button>
      <button
        onClick={() => handleAction('discard')}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {activeAction === 'discard' ? '...' : '🗑️ Discard'}
      </button>
    </div>
  )
}
