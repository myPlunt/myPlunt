import { useState } from 'react'

import { ApiError } from '../../lib/api'
import Card from '../logs/Card'

type JobCardProps = {
  title: string
  description: string
  run: () => Promise<void>
}

function JobCard({ title, description, run }: JobCardProps) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'running' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setStatus('running')
    setError(null)
    try {
      await run()
      setStatus('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Can't reach the server.")
      setStatus('idle')
    }
  }

  return (
    <Card title={title} subtitle={description}>
      {status === 'done' && (
        <p role="status" className="text-sm font-semibold text-green">
          Done.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-soil">
          {error}
        </p>
      )}
      <div className="mt-auto flex gap-2">
        {status === 'confirming' || status === 'running' ? (
          <>
            <button
              type="button"
              disabled={status === 'running'}
              onClick={start}
              className="min-h-11 flex-1 rounded-full bg-charcoal px-4 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {status === 'running' ? 'Running…' : 'Yes, run it'}
            </button>
            <button
              type="button"
              disabled={status === 'running'}
              onClick={() => setStatus('idle')}
              className="min-h-11 flex-1 rounded-full border border-green px-4 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setStatus('confirming')}
            className="min-h-11 flex-1 rounded-full bg-green px-4 text-sm font-semibold text-white transition-opacity hover:opacity-80"
          >
            Run
          </button>
        )}
      </div>
    </Card>
  )
}

export default JobCard
