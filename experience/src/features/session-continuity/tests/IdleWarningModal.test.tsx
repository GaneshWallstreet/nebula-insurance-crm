import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IdleWarningModal } from '../IdleWarningModal'

describe('IdleWarningModal', () => {
  it('renders the alert dialog with countdown text', () => {
    render(
      <IdleWarningModal
        open
        remainingMs={300_000}
        onStaySignedIn={vi.fn()}
        onSignOut={vi.fn()}
      />,
    )

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('5:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stay signed in/i })).toHaveFocus()
  })

  it('calls the selected action handlers', () => {
    const onStaySignedIn = vi.fn()
    const onSignOut = vi.fn()

    render(
      <IdleWarningModal
        open
        remainingMs={29_000}
        onStaySignedIn={onStaySignedIn}
        onSignOut={onSignOut}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /stay signed in/i }))
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(onStaySignedIn).toHaveBeenCalledTimes(1)
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('treats Escape as sign out', () => {
    const onSignOut = vi.fn()

    render(
      <IdleWarningModal
        open
        remainingMs={30_000}
        onStaySignedIn={vi.fn()}
        onSignOut={onSignOut}
      />,
    )

    fireEvent.keyDown(screen.getByRole('alertdialog').parentElement!, {
      key: 'Escape',
    })

    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
