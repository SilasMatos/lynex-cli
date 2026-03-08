import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '#/lib/auth-client'
import { syncWorkspace, listWorkspaces } from '#/lib/workspace-api'
import type { ApiWorkspace } from '#/lib/workspace-api'
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
const LS_FOLDERS_KEY = 'lynex-local-folders'
const LS_LINKS_KEY = 'lynex-local-links'
const LS_NAME_KEY = 'lynex-local-name'

function mapWorkspaceToCollections(ws: ApiWorkspace) {
  const now = new Date().toISOString()
  clearCollections()
  hydrateCollections(
    ws.folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId, createdAt: now, updatedAt: now })),
    ws.links.map((l) => ({ id: l.id, title: l.title, url: l.url, folderId: l.folderId, createdAt: now, updatedAt: now }))
  )
}

export function useWorkspace() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const isAuthenticated = !!session?.user

  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('My Workspace')
  const [isSyncing, setIsSyncing] = useState(false)

  const workspaceIdRef = useRef<string | null>(null)
  const workspaceNameRef = useRef('My Workspace')
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const localInitializedRef = useRef(false)

  const { data: folders } = useLiveQuery(foldersCollection)
  const { data: links } = useLiveQuery(linksCollection)

  const { data: allWorkspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: listWorkspaces,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!isAuthenticated || allWorkspaces.length === 0) return
    if (workspaceIdRef.current) return
    const ws = allWorkspaces[0]
    workspaceIdRef.current = ws.id
    workspaceNameRef.current = ws.name
    setWorkspaceId(ws.id)
    setWorkspaceName(ws.name)
    mapWorkspaceToCollections(ws)
  }, [isAuthenticated, allWorkspaces])

  useEffect(() => {
    if (isAuthenticated) return
    if (localInitializedRef.current) return
    localInitializedRef.current = true
    try {
      const sf = localStorage.getItem(LS_FOLDERS_KEY)
      const sl = localStorage.getItem(LS_LINKS_KEY)
      const sn = localStorage.getItem(LS_NAME_KEY)
      if (sn) { workspaceNameRef.current = sn; setWorkspaceName(sn) }
      if (sf || sl) {
        hydrateCollections(
          sf ? (JSON.parse(sf) as Folder[]) : [],
          sl ? (JSON.parse(sl) as Link[]) : []
        )
      }
    } catch { /* ignore */ }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated || isLoading) return
    try {
      localStorage.setItem(LS_FOLDERS_KEY, JSON.stringify(folders ?? []))
      localStorage.setItem(LS_LINKS_KEY, JSON.stringify(links ?? []))
      localStorage.setItem(LS_NAME_KEY, workspaceName)
    } catch { /* ignore */ }
  }, [folders, links, workspaceName, isAuthenticated, isLoading])

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

  const selectWorkspace = useCallback(
    (wsId: string) => {
      const ws = allWorkspaces.find((w) => w.id === wsId)
      if (!ws) return
      workspaceIdRef.current = ws.id
      workspaceNameRef.current = ws.name
      setWorkspaceId(ws.id)
      setWorkspaceName(ws.name)
      mapWorkspaceToCollections(ws)
    },
    [allWorkspaces]
  )

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
    if (!isAuthenticated) return null
    try {
      const result = await createWorkspaceMutation()
      return result.workspaceId
    } catch {
      return null
    }
  }, [isAuthenticated, createWorkspaceMutation])

  const addFolder = useCallback(
    (name: string, parentId: string | null = null): Folder => {
      const folder: Folder = { id: crypto.randomUUID(), name, parentId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      applyFolderChange({ op: 'insert', value: folder })
      scheduleSyncToApi()
      return folder
    },
    [scheduleSyncToApi]
  )

  const addLink = useCallback(
    (title: string, url: string, folderId: string | null = null): Link => {
      const link: Link = { id: crypto.randomUUID(), title, url, folderId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      applyLinkChange({ op: 'insert', value: link })
      scheduleSyncToApi()
      return link
    },
    [scheduleSyncToApi]
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
      scheduleSyncToApi()
    },
    [scheduleSyncToApi]
  )

  const deleteLink = useCallback(
    (linkId: string) => {
      applyLinkChange({ op: 'delete', key: linkId })
      scheduleSyncToApi()
    },
    [scheduleSyncToApi]
  )

  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      const folder = foldersCollection.get(folderId)
      if (!folder) return
      applyFolderChange({ op: 'update', value: { ...folder, name, updatedAt: new Date().toISOString() } })
      scheduleSyncToApi()
    },
    [scheduleSyncToApi]
  )

  const updateLink = useCallback(
    (linkId: string, updates: Partial<Link>) => {
      const link = linksCollection.get(linkId)
      if (!link) return
      applyLinkChange({ op: 'update', value: { ...link, ...updates, updatedAt: new Date().toISOString() } })
      scheduleSyncToApi()
    },
    [scheduleSyncToApi]
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
      scheduleSyncToApi()
    },
    [scheduleSyncToApi]
  )

  const moveLink = useCallback(
    (linkId: string, newFolderId: string | null) => {
      const link = linksCollection.get(linkId)
      if (!link) return
      applyLinkChange({ op: 'update', value: { ...link, folderId: newFolderId, updatedAt: new Date().toISOString() } })
      scheduleSyncToApi()
    },
    [scheduleSyncToApi]
  )

  const renameWorkspace = useCallback(
    (name: string) => {
      workspaceNameRef.current = name
      setWorkspaceName(name)
      queryClient.setQueryData<ApiWorkspace[]>(['workspaces'], (prev = []) =>
        prev.map((ws) => (ws.id === workspaceIdRef.current ? { ...ws, name } : ws))
      )
      scheduleSyncToApi()
    },
    [queryClient, scheduleSyncToApi]
  )

  return {
    data: { folders: folders ?? [], links: links ?? [] },
    workspaceId,
    workspaceName,
    allWorkspaces,
    isLoading: isAuthenticated ? isLoading : false,
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
  }
}

