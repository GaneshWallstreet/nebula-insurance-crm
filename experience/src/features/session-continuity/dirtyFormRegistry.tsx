import {
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import {
  snapshotDirtyForm,
  type SnapshotResult,
} from './sessionRestore'
import {
  DirtyFormRegistryContext,
  type DirtyFormRegistration,
  type DirtyFormRegistry,
} from './dirtyFormRegistryContext'

export function DirtyFormRegistryProvider(props: { children: ReactNode }): JSX.Element {
  const registrations = useRef(new Map<string, DirtyFormRegistration>())

  const register = useCallback(<TValues,>(
    registration: DirtyFormRegistration<TValues>,
  ) => {
    registrations.current.set(
      registration.formKey,
      registration as DirtyFormRegistration,
    )

    return () => {
      registrations.current.delete(registration.formKey)
    }
  }, [])

  const snapshotAllDirty = useCallback((userId: string, route: string) => {
    const results: SnapshotResult[] = []
    for (const registration of registrations.current.values()) {
      if (!registration.isDirty()) {
        continue
      }

      results.push(
        snapshotDirtyForm({
          user_id: userId,
          route: registration.route || route,
          form_key: registration.formKey,
          form_values: registration.getValues(),
          dirty_field_paths: registration.getDirtyFieldPaths(),
          snapshot_timestamp: new Date().toISOString(),
        }),
      )
    }

    return results
  }, [])

  const value = useMemo<DirtyFormRegistry>(
    () => ({ register, snapshotAllDirty }),
    [register, snapshotAllDirty],
  )

  return (
    <DirtyFormRegistryContext.Provider value={value}>
      {props.children}
    </DirtyFormRegistryContext.Provider>
  )
}
