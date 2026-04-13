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
  const [showReplaceForm, setShowReplaceForm] = useState(false)
  const [replaceTag, setReplaceTag] = useState(itemTag || '')

  async function handleAction(action: ActionType) {
    if (action === 'discard_replace' && !showReplaceForm) {
      setShowReplaceForm(true)
      return
    }

    setLoading(true)
    setActiveAction(action)

    try {
      const body: any = { issueId, action }
      if (action === 'discard_replace') {
        body.newItemTag = replaceTag || null
      }

      const res = await fetch('/api/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

      setShowReplaceForm(false)
      router.refresh()
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
      setActiveAction(null)
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-row gap-2">
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

      {showReplaceForm && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-xs font-medium text-blue-900 mb-1">
            Tag for replacement device
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={replaceTag}
              onChange={(e) => setReplaceTag(e.target.value)}
              placeholder="Enter tag or leave empty"
              className="flex-1 px-3 py-1.5 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => handleAction('discard_replace')}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Confirm Replace'}
            </button>
            <button
              onClick={() => setShowReplaceForm(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Old tag: {itemTag || 'none'} — enter a new tag or leave as-is
          </p>
        </div>
      )}
    </div>
  )
}
