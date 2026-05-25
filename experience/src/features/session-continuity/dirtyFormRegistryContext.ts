import { createContext } from 'react'
import type { SnapshotResult } from './sessionRestore'

export interface DirtyFormRegistration<TValues = unknown> {
  formKey: string
  route: string
  isDirty: () => boolean
  getValues: () => TValues
  getDirtyFieldPaths: () => string[]
}

export interface DirtyFormRegistry {
  register<TValues>(registration: DirtyFormRegistration<TValues>): () => void
  snapshotAllDirty(userId: string, route: string): SnapshotResult[]
}

export const DirtyFormRegistryContext = createContext<DirtyFormRegistry | null>(null)
