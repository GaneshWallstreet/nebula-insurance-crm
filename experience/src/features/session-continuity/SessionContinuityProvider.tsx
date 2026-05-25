import type { ReactNode } from 'react'
import { DirtyFormRegistryProvider } from './dirtyFormRegistry'
import { IdleWarningModal } from './IdleWarningModal'
import { useIdleWarning } from './useIdleWarning'

export function SessionContinuityProvider(props: { children: ReactNode }): JSX.Element {
  const idleWarning = useIdleWarning()

  return (
    <DirtyFormRegistryProvider>
      {props.children}
      <IdleWarningModal
        open={idleWarning.modalOpen}
        remainingMs={idleWarning.remainingMs}
        onStaySignedIn={() => {
          void idleWarning.staySignedIn()
        }}
        onSignOut={() => {
          void idleWarning.signOut()
        }}
      />
    </DirtyFormRegistryProvider>
  )
}
