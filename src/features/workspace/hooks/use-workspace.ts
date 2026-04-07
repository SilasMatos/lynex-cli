import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '#/lib/auth-client'
import { syncWorkspace, listWorkspaces, deleteWorkspace as deleteWorkspaceApi } from '#/lib/workspace-api'
import type { ApiWorkspace } from '#/lib/workspace-api'
import type { WorkspaceJsonPayload } from '#/lib/workspace-json'
import {
  foldersCollection,
  linksCollection,
  applyFolderChange,
  applyLinkChange,
  hydrateCollections,
  clearCollections,
} from '../db'
import type { Folder, Link } from '../types'

const SYNC_DEBOUNCE_MS = 1500

const LS_WORKSPACES_KEY = 'lynex-local-workspaces'
const LS_ACTIVE_KEY = 'lynex-local-active-id'

const LS_OLD_FOLDERS_KEY = 'lynex-local-folders'
const LS_OLD_LINKS_KEY = 'lynex-local-links'
const LS_OLD_NAME_KEY = 'lynex-local-name'

type LocalWorkspace = {
  id: string
  name: string
  folders: Folder[]
  links: Link[]
}

function readLocalWorkspaces(): LocalWorkspace[] {
  try {
    const raw = localStorage.getItem(LS_WORKSPACES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function writeLocalWorkspaces(workspaces: LocalWorkspace[]) {
  try {
    localStorage.setItem(LS_WORKSPACES_KEY, JSON.stringify(workspaces))
  } catch { /* ignore */ }
}

function readActiveLocalId(): string | null {
  try {
    return localStorage.getItem(LS_ACTIVE_KEY)
  } catch { return null }
}

function writeActiveLocalId(id: string | null) {
  try {
    if (id) localStorage.setItem(LS_ACTIVE_KEY, id)
    else localStorage.removeItem(LS_ACTIVE_KEY)
  } catch { /* ignore */ }
}

function migrateOldFormat(): LocalWorkspace | null {
  try {
    const sf = localStorage.getItem(LS_OLD_FOLDERS_KEY)
    const sl = localStorage.getItem(LS_OLD_LINKS_KEY)
    const sn = localStorage.getItem(LS_OLD_NAME_KEY)

    const folders: Folder[] = sf ? JSON.parse(sf) : []
    const links: Link[] = sl ? JSON.parse(sl) : []

    localStorage.removeItem(LS_OLD_FOLDERS_KEY)
    localStorage.removeItem(LS_OLD_LINKS_KEY)
    localStorage.removeItem(LS_OLD_NAME_KEY)

    if (folders.length === 0 && links.length === 0 && !sn) return null

    return {
      id: crypto.randomUUID(),
      name: sn || 'My Workspace',
      folders,
      links,
    }
  } catch { return null }
}

function localToApi(lw: LocalWorkspace): ApiWorkspace {
  return {
    id: lw.id,
    name: lw.name,
    folders: lw.folders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })),
    links: lw.links.map(l => ({ id: l.id, title: l.title, url: l.url, folderId: l.folderId })),
  }
}

function mapWorkspaceToCollections(ws: ApiWorkspace) {
  const now = new Date().toISOString()
  clearCollections()
  hydrateCollections(
    ws.folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId, createdAt: now, updatedAt: now })),
    ws.links.map((l) => ({ id: l.id, title: l.title, url: l.url, folderId: l.folderId, createdAt: now, updatedAt: now }))
  )
}

function loadLocalWorkspaceIntoCollections(ws: LocalWorkspace) {
  const now = new Date().toISOString()
  clearCollections()
  hydrateCollections(
    ws.folders.map(f => ({ ...f, createdAt: f.createdAt || now, updatedAt: f.updatedAt || now })),
    ws.links.map(l => ({ ...l, createdAt: l.createdAt || now, updatedAt: l.updatedAt || now }))
  )
}

export function useWorkspace() {
  const { data: session, isPending: isSessionLoading } = useSession()
  const queryClient = useQueryClient()
  const isAuthenticated = !!session?.user

  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('My Workspace')
  const [isSyncing, setIsSyncing] = useState(false)
  const [localWorkspaces, setLocalWorkspaces] = useState<LocalWorkspace[]>([])
  const [migrationDone, setMigrationDone] = useState(false)

  const workspaceIdRef = useRef<string | null>(null)
  const workspaceNameRef = useRef('My Workspace')
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const migrationAttemptedRef = useRef(false)
  const localInitializedRef = useRef(false)
  const prevAuthRef = useRef(isAuthenticated)

  const { data: folders } = useLiveQuery(foldersCollection)
  const { data: links } = useLiveQuery(linksCollection)

  const { data: apiWorkspaces = [], isLoading: isApiLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: listWorkspaces,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })

  const allWorkspaces: ApiWorkspace[] = isAuthenticated
    ? apiWorkspaces
    : localWorkspaces.map(localToApi)

  // ─── Save current workspace to localStorage ───
  const saveCurrentWorkspaceLocally = useCallback(() => {
    if (isAuthenticated) return
    const currentId = workspaceIdRef.current
    if (!currentId) return

    const updated: LocalWorkspace = {
      id: currentId,
      name: workspaceNameRef.current,
      folders: [...foldersCollection.values()],
      links: [...linksCollection.values()],
    }

    setLocalWorkspaces(prev => {
      const idx = prev.findIndex(w => w.id === currentId)
      const next = idx >= 0
        ? prev.map((w, i) => i === idx ? updated : w)
        : [...prev, updated]
      writeLocalWorkspaces(next)
      return next
    })
  }, [isAuthenticated])

  // ─── Unified persist: API sync or local save ───
  const { mutate: syncToApi } = useMutation({
    mutationFn: () => syncWorkspace({
      id: workspaceIdRef.current ?? undefined,
      name: workspaceNameRef.current,
      folders: [...foldersCollection.values()].map((f) => ({ id: f.id, name: f.name, parentId: f.parentId })),
      links: [...linksCollection.values()].map((l) => ({ id: l.id, title: l.title, url: l.url, folderId: l.folderId })),
    }),
    onMutate: () => setIsSyncing(true),
    onSuccess: (result) => {
      workspaceIdRef.current = result.workspaceId
      setWorkspaceId(result.workspaceId)
      queryClient.setQueryData<ApiWorkspace[]>(['workspaces'], (prev = []) =>
        prev.find((w) => w.id === result.workspaceId)
          ? prev.map((w) => w.id === result.workspaceId ? { ...w, name: workspaceNameRef.current } : w)
          : [...prev, { id: result.workspaceId, name: workspaceNameRef.current, folders: [], links: [] }]
      )
    },
    onSettled: () => setIsSyncing(false),
  })

  const scheduleSyncToApi = useCallback(() => {
    if (!isAuthenticated) return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => syncToApi(), SYNC_DEBOUNCE_MS)
  }, [isAuthenticated, syncToApi])

  const persistChanges = useCallback(() => {
    if (isAuthenticated) {
      scheduleSyncToApi()
    } else {
      saveCurrentWorkspaceLocally()
    }
  }, [isAuthenticated, scheduleSyncToApi, saveCurrentWorkspaceLocally])

  // ─── Init local workspaces + handle logout transition ───
  useEffect(() => {
    if (isSessionLoading) return

    const wasAuthenticated = prevAuthRef.current
    prevAuthRef.current = isAuthenticated

    if (isAuthenticated) return

    if (wasAuthenticated) {
      clearCollections()
      workspaceIdRef.current = null
      workspaceNameRef.current = 'My Workspace'
      setWorkspaceId(null)
      setWorkspaceName('My Workspace')
      localInitializedRef.current = false
    }

    if (localInitializedRef.current) return
    localInitializedRef.current = true

    const migrated = migrateOldFormat()
    let workspaces = readLocalWorkspaces()
    if (migrated) {
      workspaces = [...workspaces, migrated]
      writeLocalWorkspaces(workspaces)
    }

    setLocalWorkspaces(workspaces)

    if (workspaces.length === 0) return

    const activeId = readActiveLocalId()
    const target = workspaces.find(w => w.id === activeId) ?? workspaces[0]

    workspaceIdRef.current = target.id
    workspaceNameRef.current = target.name
    setWorkspaceId(target.id)
    setWorkspaceName(target.name)
    writeActiveLocalId(target.id)
    loadLocalWorkspaceIntoCollections(target)
  }, [isAuthenticated, isSessionLoading])

  // ─── Migrate ALL local workspaces to API on login ───
  useEffect(() => {
    if (isSessionLoading) return
    if (!isAuthenticated) {
      migrationAttemptedRef.current = false
      setMigrationDone(false)
      return
    }
    if (migrationAttemptedRef.current) return
    migrationAttemptedRef.current = true

    const memFolders = [...foldersCollection.values()]
    const memLinks = [...linksCollection.values()]

    const storedWorkspaces = readLocalWorkspaces()
    const oldMigrated = migrateOldFormat()

    const toMigrate: LocalWorkspace[] = [...storedWorkspaces]
    if (oldMigrated) toMigrate.push(oldMigrated)

    if (memFolders.length > 0 || memLinks.length > 0) {
      const currentId = workspaceIdRef.current
      const alreadyInList = currentId && toMigrate.some(w => w.id === currentId)
      if (!alreadyInList) {
        toMigrate.push({
          id: currentId || crypto.randomUUID(),
          name: workspaceNameRef.current,
          folders: memFolders,
          links: memLinks,
        })
      } else if (currentId) {
        const idx = toMigrate.findIndex(w => w.id === currentId)
        if (idx >= 0) {
          toMigrate[idx] = { ...toMigrate[idx], folders: memFolders, links: memLinks }
        }
      }
    }

    localStorage.removeItem(LS_WORKSPACES_KEY)
    localStorage.removeItem(LS_ACTIVE_KEY)
    localStorage.removeItem(LS_OLD_FOLDERS_KEY)
    localStorage.removeItem(LS_OLD_LINKS_KEY)
    localStorage.removeItem(LS_OLD_NAME_KEY)

    setLocalWorkspaces([])

    if (toMigrate.length === 0) {
      setMigrationDone(true)
      return
    }

    Promise.all(
      toMigrate.map(ws =>
        syncWorkspace({
          name: ws.name,
          folders: ws.folders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })),
          links: ws.links.map(l => ({ id: l.id, title: l.title, url: l.url, folderId: l.folderId })),
        }).then(result => ({ ...ws, apiId: result.workspaceId }))
          .catch(() => null)
      )
    ).then((results) => {
      const synced = results.filter(Boolean) as (LocalWorkspace & { apiId: string })[]

      if (synced.length > 0) {
        const first = synced[0]
        loadLocalWorkspaceIntoCollections(first)
        workspaceIdRef.current = first.apiId
        workspaceNameRef.current = first.name
        setWorkspaceId(first.apiId)
        setWorkspaceName(first.name)
      }

      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    }).catch(() => {
      writeLocalWorkspaces(toMigrate)
    }).finally(() => {
      setMigrationDone(true)
    })
  }, [isAuthenticated, isSessionLoading, queryClient])

  // ─── Load initial workspace from API (after migration, no local data) ───
  useEffect(() => {
    if (!isAuthenticated || !migrationDone || apiWorkspaces.length === 0) return
    if (workspaceIdRef.current) return
    const ws = apiWorkspaces[0]
    workspaceIdRef.current = ws.id
    workspaceNameRef.current = ws.name
    setWorkspaceId(ws.id)
    setWorkspaceName(ws.name)
    mapWorkspaceToCollections(ws)
  }, [isAuthenticated, migrationDone, apiWorkspaces])

  // ─── Workspace selection ───
  const selectWorkspace = useCallback(
    (wsId: string) => {
      if (isAuthenticated) {
        const ws = apiWorkspaces.find((w) => w.id === wsId)
        if (!ws) return
        workspaceIdRef.current = ws.id
        workspaceNameRef.current = ws.name
        setWorkspaceId(ws.id)
        setWorkspaceName(ws.name)
        mapWorkspaceToCollections(ws)
      } else {
        saveCurrentWorkspaceLocally()
        const ws = localWorkspaces.find(w => w.id === wsId)
        if (!ws) return
        workspaceIdRef.current = ws.id
        workspaceNameRef.current = ws.name
        setWorkspaceId(ws.id)
        setWorkspaceName(ws.name)
        writeActiveLocalId(ws.id)
        loadLocalWorkspaceIntoCollections(ws)
      }
    },
    [isAuthenticated, apiWorkspaces, localWorkspaces, saveCurrentWorkspaceLocally]
  )

  // ─── Create workspace ───
  const { mutateAsync: createWorkspaceMutation } = useMutation({
    mutationFn: () => syncWorkspace({ name: 'Novo Workspace', folders: [], links: [] }),
    onMutate: () => setIsSyncing(true),
    onSuccess: (result) => {
      const newWs: ApiWorkspace = { id: result.workspaceId, name: 'Novo Workspace', folders: [], links: [] }
      queryClient.setQueryData<ApiWorkspace[]>(['workspaces'], (prev = []) => [...prev, newWs])
      clearCollections()
      workspaceIdRef.current = result.workspaceId
      workspaceNameRef.current = 'Novo Workspace'
      setWorkspaceId(result.workspaceId)
      setWorkspaceName('Novo Workspace')
    },
    onSettled: () => setIsSyncing(false),
  })

  const createWorkspace = useCallback(async (): Promise<string | null> => {
    if (isAuthenticated) {
      try {
        const result = await createWorkspaceMutation()
        return result.workspaceId
      } catch {
        return null
      }
    }

    saveCurrentWorkspaceLocally()

    const newId = crypto.randomUUID()
    const newWs: LocalWorkspace = { id: newId, name: 'Novo Workspace', folders: [], links: [] }

    setLocalWorkspaces(prev => {
      const next = [...prev, newWs]
      writeLocalWorkspaces(next)
      return next
    })

    clearCollections()
    workspaceIdRef.current = newId
    workspaceNameRef.current = 'Novo Workspace'
    setWorkspaceId(newId)
    setWorkspaceName('Novo Workspace')
    writeActiveLocalId(newId)

    return newId
  }, [isAuthenticated, createWorkspaceMutation, saveCurrentWorkspaceLocally])

  // ─── Delete workspace ───
  const { mutateAsync: deleteWorkspaceMutation } = useMutation({
    mutationFn: (wsId: string) => deleteWorkspaceApi(wsId),
    onMutate: (deletedId: string) => {
      const previous = queryClient.getQueryData<ApiWorkspace[]>(['workspaces']) ?? []
      const next = previous.filter((w) => w.id !== deletedId)
      queryClient.setQueryData(['workspaces'], next)
      let previousCurrentId: string | null | undefined = undefined
      if (deletedId === workspaceIdRef.current) {
        previousCurrentId = workspaceIdRef.current
        if (next.length > 0) {
          const other = next[0]
          workspaceIdRef.current = other.id
          workspaceNameRef.current = other.name
          setWorkspaceId(other.id)
          setWorkspaceName(other.name)
          mapWorkspaceToCollections(other)
        } else {
          workspaceIdRef.current = null
          workspaceNameRef.current = 'My Workspace'
          setWorkspaceId(null)
          setWorkspaceName('My Workspace')
          clearCollections()
        }
      }
      return { previousWorkspaces: previous, previousCurrentId }
    },
    onError: (_err, _deletedId, context) => {
      if (!context) return
      queryClient.setQueryData(['workspaces'], context.previousWorkspaces)
      if (context.previousCurrentId !== undefined) {
        const prev = context.previousWorkspaces as ApiWorkspace[]
        const restored = prev.find((w) => w.id === context.previousCurrentId)
        if (restored) {
          workspaceIdRef.current = restored.id
          workspaceNameRef.current = restored.name
          setWorkspaceId(restored.id)
          setWorkspaceName(restored.name)
          mapWorkspaceToCollections(restored)
        }
      }
    },
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<ApiWorkspace[]>(['workspaces'], (prev = []) => {
        const next = prev.filter((w) => w.id !== deletedId)
        if (deletedId === workspaceIdRef.current) {
          if (next.length > 0) {
            const other = next[0]
            workspaceIdRef.current = other.id
            workspaceNameRef.current = other.name
            setWorkspaceId(other.id)
            setWorkspaceName(other.name)
            mapWorkspaceToCollections(other)
          } else {
            workspaceIdRef.current = null
            workspaceNameRef.current = 'My Workspace'
            setWorkspaceId(null)
            setWorkspaceName('My Workspace')
            clearCollections()
          }
        }
        return next
      })
    },
  })

  const deleteWorkspace = useCallback(
    async (wsId: string): Promise<void> => {
      if (isAuthenticated) {
        try {
          await deleteWorkspaceMutation(wsId)
        } catch { /* ignore */ }
        return
      }

      const current = localWorkspaces
      const next = current.filter(w => w.id !== wsId)
      writeLocalWorkspaces(next)
      setLocalWorkspaces(next)

      if (wsId === workspaceIdRef.current) {
        if (next.length > 0) {
          const other = next[0]
          workspaceIdRef.current = other.id
          workspaceNameRef.current = other.name
          setWorkspaceId(other.id)
          setWorkspaceName(other.name)
          writeActiveLocalId(other.id)
          loadLocalWorkspaceIntoCollections(other)
        } else {
          workspaceIdRef.current = null
          workspaceNameRef.current = 'My Workspace'
          setWorkspaceId(null)
          setWorkspaceName('My Workspace')
          writeActiveLocalId(null)
          clearCollections()
        }
      }
    },
    [isAuthenticated, deleteWorkspaceMutation, localWorkspaces]
  )

  // ─── Create workspace from JSON payload ───
  const { mutateAsync: createFromPayloadMutation } = useMutation({
    mutationFn: (payload: WorkspaceJsonPayload) =>
      syncWorkspace({
        name: payload.name,
        folders: payload.folders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })),
        links: payload.links.map(l => ({ id: l.id, title: l.title, url: l.url, folderId: l.folderId })),
      }),
    onMutate: () => setIsSyncing(true),
    onSuccess: (result, payload) => {
      const newWs: ApiWorkspace = {
        id: result.workspaceId,
        name: payload.name,
        folders: payload.folders.map(f => ({
          id: f.id ?? crypto.randomUUID(),
          name: f.name,
          parentId: f.parentId,
        })),
        links: payload.links.map(l => ({
          id: l.id ?? crypto.randomUUID(),
          title: l.title,
          url: l.url,
          folderId: l.folderId,
        })),
      }
      queryClient.setQueryData<ApiWorkspace[]>(['workspaces'], (prev = []) => [...prev, newWs])
      clearCollections()
      mapWorkspaceToCollections(newWs)
      workspaceIdRef.current = result.workspaceId
      workspaceNameRef.current = payload.name
      setWorkspaceId(result.workspaceId)
      setWorkspaceName(payload.name)
    },
    onSettled: () => setIsSyncing(false),
  })

  const createWorkspaceFromPayload = useCallback(
    async (payload: WorkspaceJsonPayload): Promise<string | null> => {
      if (isAuthenticated) {
        try {
          const result = await createFromPayloadMutation(payload)
          return result.workspaceId
        } catch {
          return null
        }
      }

      saveCurrentWorkspaceLocally()

      const now = new Date().toISOString()
      const newId = crypto.randomUUID()
      const newFolders: Folder[] = payload.folders.map(f => ({
        id: f.id || crypto.randomUUID(),
        name: f.name,
        parentId: f.parentId,
        createdAt: now,
        updatedAt: now,
      }))
      const newLinks: Link[] = payload.links.map(l => ({
        id: l.id || crypto.randomUUID(),
        title: l.title,
        url: l.url,
        folderId: l.folderId,
        createdAt: now,
        updatedAt: now,
      }))

      const newWs: LocalWorkspace = { id: newId, name: payload.name, folders: newFolders, links: newLinks }

      setLocalWorkspaces(prev => {
        const next = [...prev, newWs]
        writeLocalWorkspaces(next)
        return next
      })

      clearCollections()
      hydrateCollections(newFolders, newLinks)
      workspaceIdRef.current = newId
      workspaceNameRef.current = payload.name
      setWorkspaceId(newId)
      setWorkspaceName(payload.name)
      writeActiveLocalId(newId)

      return newId
    },
    [isAuthenticated, createFromPayloadMutation, saveCurrentWorkspaceLocally]
  )

  // ─── Item CRUD ───
  const addFolder = useCallback(
    (name: string, parentId: string | null = null): Folder => {
      const folder: Folder = { id: crypto.randomUUID(), name, parentId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      applyFolderChange({ op: 'insert', value: folder })
      persistChanges()
      return folder
    },
    [persistChanges]
  )

  const addLink = useCallback(
    (title: string, url: string, folderId: string | null = null): Link => {
      const link: Link = { id: crypto.randomUUID(), title, url, folderId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      applyLinkChange({ op: 'insert', value: link })
      persistChanges()
      return link
    },
    [persistChanges]
  )

  const deleteFolder = useCallback(
    (folderId: string) => {
      const allFolders = [...foldersCollection.values()]
      const idsToDelete = new Set<string>()
      const collect = (id: string) => {
        idsToDelete.add(id)
        allFolders.filter((f) => f.parentId === id).forEach((f) => collect(f.id))
      }
      collect(folderId)
      for (const id of idsToDelete) applyFolderChange({ op: 'delete', key: id })
      for (const link of linksCollection.values()) {
        if (link.folderId && idsToDelete.has(link.folderId)) applyLinkChange({ op: 'delete', key: link.id })
      }
      persistChanges()
    },
    [persistChanges]
  )

  const deleteLink = useCallback(
    (linkId: string) => {
      applyLinkChange({ op: 'delete', key: linkId })
      persistChanges()
    },
    [persistChanges]
  )

  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      const folder = foldersCollection.get(folderId)
      if (!folder) return
      applyFolderChange({ op: 'update', value: { ...folder, name, updatedAt: new Date().toISOString() } })
      persistChanges()
    },
    [persistChanges]
  )

  const updateLink = useCallback(
    (linkId: string, updates: Partial<Link>) => {
      const link = linksCollection.get(linkId)
      if (!link) return
      applyLinkChange({ op: 'update', value: { ...link, ...updates, updatedAt: new Date().toISOString() } })
      persistChanges()
    },
    [persistChanges]
  )

  const moveFolder = useCallback(
    (folderId: string, newParentId: string | null) => {
      const folder = foldersCollection.get(folderId)
      if (!folder) return
      const isDescendant = (parentId: string | null, targetId: string): boolean => {
        if (parentId === null) return false
        if (parentId === targetId) return true
        const parent = foldersCollection.get(parentId)
        return parent ? isDescendant(parent.parentId, targetId) : false
      }
      if (newParentId !== null && isDescendant(newParentId, folderId)) return
      applyFolderChange({ op: 'update', value: { ...folder, parentId: newParentId, updatedAt: new Date().toISOString() } })
      persistChanges()
    },
    [persistChanges]
  )

  const moveLink = useCallback(
    (linkId: string, newFolderId: string | null) => {
      const link = linksCollection.get(linkId)
      if (!link) return
      applyLinkChange({ op: 'update', value: { ...link, folderId: newFolderId, updatedAt: new Date().toISOString() } })
      persistChanges()
    },
    [persistChanges]
  )

  const renameWorkspace = useCallback(
    (name: string) => {
      workspaceNameRef.current = name
      setWorkspaceName(name)

      if (isAuthenticated) {
        queryClient.setQueryData<ApiWorkspace[]>(['workspaces'], (prev = []) =>
          prev.map((ws) => (ws.id === workspaceIdRef.current ? { ...ws, name } : ws))
        )
      }

      persistChanges()
    },
    [isAuthenticated, queryClient, persistChanges]
  )

  return {
    data: { folders: folders ?? [], links: links ?? [] },
    workspaceId,
    workspaceName,
    allWorkspaces,
    isLoading: isSessionLoading || (isAuthenticated ? isApiLoading : false),
    isSyncing,
    addFolder,
    addLink,
    deleteFolder,
    deleteLink,
    renameFolder,
    updateLink,
    moveFolder,
    moveLink,
    selectWorkspace,
    renameWorkspace,
    createWorkspace,
    createWorkspaceFromPayload,
    deleteWorkspace,
  }
}
