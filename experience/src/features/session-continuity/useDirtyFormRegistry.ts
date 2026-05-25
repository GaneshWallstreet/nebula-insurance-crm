import { useContext, useEffect } from 'react'
import {
  DirtyFormRegistryContext,
  type DirtyFormRegistration,
  type DirtyFormRegistry,
} from './dirtyFormRegistryContext'

export function useDirtyFormRegistry(): DirtyFormRegistry {
  const registry = useContext(DirtyFormRegistryContext)
  if (!registry) {
    throw new Error('useDirtyFormRegistry must be used inside DirtyFormRegistryProvider')
  }

  return registry
}

export function useSessionRestorableForm<TValues>(
  registration: DirtyFormRegistration<TValues>,
): void {
  const registry = useDirtyFormRegistry()

  useEffect(() => {
    return registry.register(registration)
  }, [registry, registration])
}
