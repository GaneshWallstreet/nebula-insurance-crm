import { axe } from 'jest-axe'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IdleWarningModal } from '../IdleWarningModal'

describe('IdleWarningModal accessibility', () => {
  it('has no axe violations when open', async () => {
    const { container } = render(
      <IdleWarningModal
        open
        remainingMs={300_000}
        onStaySignedIn={vi.fn()}
        onSignOut={vi.fn()}
      />,
    )

    await expect(axe(container)).resolves.toHaveNoViolations()
  })
})
