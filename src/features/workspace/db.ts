import { createCollection } from '@tanstack/react-db'
import type { Folder, Link } from './types'

type SyncCallbacks = {
  begin: (opts?: { immediate?: boolean }) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  write: (msg: any) => void
  commit: () => void
}

let _foldersSync: SyncCallbacks | null = null
let _linksSync: SyncCallbacks | null = null

export const foldersCollection = createCollection<Folder, string>({
  id: 'lynex-folders',
  getKey: (folder) => folder.id,
  sync: {
    sync: ({ begin, write, commit }) => {
      _foldersSync = { begin, write, commit }
      begin()
      commit()
    },
  },
})

export const linksCollection = createCollection<Link, string>({
  id: 'lynex-links',
  getKey: (link) => link.id,
  sync: {
    sync: ({ begin, write, commit }) => {
      _linksSync = { begin, write, commit }
      begin()
      commit()
    },
  },
})

export function applyFolderChange(
  change:
    | { op: 'insert'; value: Folder }
    | { op: 'update'; value: Folder }
    | { op: 'delete'; key: string }
) {
  if (!_foldersSync) return
  const { begin, write, commit } = _foldersSync
  begin({ immediate: true })
  if (change.op === 'delete') {
    write({ type: 'delete', key: change.key })
  } else {
    write({ type: change.op, value: change.value })
  }
  commit()
}

export function applyLinkChange(
  change:
    | { op: 'insert'; value: Link }
    | { op: 'update'; value: Link }
    | { op: 'delete'; key: string }
) {
  if (!_linksSync) return
  const { begin, write, commit } = _linksSync
  begin({ immediate: true })
  if (change.op === 'delete') {
    write({ type: 'delete', key: change.key })
  } else {
    write({ type: change.op, value: change.value })
  }
  commit()
}

export function hydrateCollections(folders: Folder[], links: Link[]) {
  if (_foldersSync) {
    const { begin, write, commit } = _foldersSync
    begin({ immediate: true })
    for (const folder of folders) {
      write({ type: 'insert', value: folder })
    }
    commit()
  }
  if (_linksSync) {
    const { begin, write, commit } = _linksSync
    begin({ immediate: true })
    for (const link of links) {
      write({ type: 'insert', value: link })
    }
    commit()
  }
}

export function clearCollections() {
  if (_foldersSync) {
    const { begin, write, commit } = _foldersSync
    begin({ immediate: true })
    for (const folder of foldersCollection.values()) {
      write({ type: 'delete', key: folder.id })
    }
    commit()
  }
  if (_linksSync) {
    const { begin, write, commit } = _linksSync
    begin({ immediate: true })
    for (const link of linksCollection.values()) {
      write({ type: 'delete', key: link.id })
    }
    commit()
  }
}
