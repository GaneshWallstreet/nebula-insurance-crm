import { useEffect, useRef, type KeyboardEvent } from 'react'

export interface IdleWarningModalProps {
  open: boolean
  remainingMs: number
  onStaySignedIn: () => void
  onSignOut: () => void
}

export function IdleWarningModal(props: IdleWarningModalProps): JSX.Element | null {
  const stayButtonRef = useRef<HTMLButtonElement>(null)
  const signOutButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (props.open) {
      stayButtonRef.current?.focus()
    }
  }, [props.open])

  if (!props.open) {
    return null
  }

  const warning = props.remainingMs <= 30_000

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      props.onSignOut()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const first = stayButtonRef.current
    const last = signOutButtonRef.current
    if (!first || !last) {
      return
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      onKeyDown={handleKeyDown}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-warning-title"
        aria-describedby="idle-warning-description"
        className="w-full max-w-md rounded-lg bg-surface p-6 text-left shadow-xl ring-1 ring-border"
      >
        <h2 id="idle-warning-title" className="text-lg font-semibold text-text-primary">
          Stay signed in?
        </h2>
        <p id="idle-warning-description" className="mt-2 text-sm text-text-muted">
          Your session is paused after inactivity. Choose an action before the timer ends.
        </p>
        <p
          className={`mt-5 text-3xl font-semibold tabular-nums ${warning ? 'text-red-700' : 'text-text-primary'}`}
          aria-live="polite"
        >
          {formatRemaining(props.remainingMs)}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            ref={stayButtonRef}
            type="button"
            className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            onClick={props.onStaySignedIn}
          >
            Stay signed in
          </button>
          <button
            ref={signOutButtonRef}
            type="button"
            className="min-h-11 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            onClick={props.onSignOut}
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  )
}

function formatRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
