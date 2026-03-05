import { useCallback, useEffect, useOptimistic, useState, useTransition } from 'react'
import type { Folder, Link, WorkspaceAction, WorkspaceData } from '../types'

const STORAGE_KEY = 'linex-workspace'

function loadData(): WorkspaceData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as WorkspaceData
    }
  } catch {
    // ignore parse errors
  }
  return { folders: [], links: [] }
}

function reducer(state: WorkspaceData, action: WorkspaceAction): WorkspaceData {
  switch (action.type) {
    case 'ADD_FOLDER':
      return { ...state, folders: [...state.folders, action.folder] }

    case 'ADD_LINK':
      return { ...state, links: [...state.links, action.link] }

    case 'DELETE_FOLDER': {
      const idsToDelete = new Set<string>()
      const collectIds = (parentId: string) => {
        idsToDelete.add(parentId)
        state.folders
          .filter((f) => f.parentId === parentId)
          .forEach((f) => collectIds(f.id))
      }
      collectIds(action.folderId)
      return {
        folders: state.folders.filter((f) => !idsToDelete.has(f.id)),
        links: state.links.filter(
          (l) => !l.folderId || !idsToDelete.has(l.folderId)
        ),
      }
    }

    case 'DELETE_LINK':
      return {
        ...state,
        links: state.links.filter((l) => l.id !== action.linkId),
      }

    case 'RENAME_FOLDER':
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === action.folderId
            ? { ...f, name: action.name, updatedAt: new Date().toISOString() }
            : f
        ),
      }

    case 'UPDATE_LINK':
      return {
        ...state,
        links: state.links.map((l) =>
          l.id === action.linkId
            ? { ...l, ...action.data, updatedAt: new Date().toISOString() }
            : l
        ),
      }

    case 'MOVE_FOLDER': {
      // Prevent moving a folder into itself or one of its descendants
      const isDescendant = (parentId: string | null, targetId: string): boolean => {
        if (parentId === null) return false
        if (parentId === targetId) return true
        const parent = state.folders.find((f) => f.id === parentId)
        return parent ? isDescendant(parent.parentId, targetId) : false
      }
      if (action.newParentId !== null && isDescendant(action.newParentId, action.folderId)) {
        return state
      }
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === action.folderId
            ? { ...f, parentId: action.newParentId, updatedAt: new Date().toISOString() }
            : f
        ),
      }
    }

    case 'MOVE_LINK':
      return {
        ...state,
        links: state.links.map((l) =>
          l.id === action.linkId
            ? { ...l, folderId: action.newFolderId, updatedAt: new Date().toISOString() }
            : l
        ),
      }

    default:
      return state
  }
}

export function useWorkspace() {
  const [data, setData] = useState<WorkspaceData>(loadData)
  const [optimisticData, addOptimistic] = useOptimistic(data, reducer)
  const [isPending, startTransition] = useTransition()

  // Persist to localStorage whenever real state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const dispatch = useCallback(
    (action: WorkspaceAction) => {
      startTransition(async () => {
        addOptimistic(action)
        // Simulate async operation — replace with API call later
        await new Promise((resolve) => setTimeout(resolve, 50))
        setData((prev) => reducer(prev, action))
      })
    },
    [addOptimistic, startTransition]
  )

  const addFolder = useCallback(
    (name: string, parentId: string | null = null) => {
      const folder: Folder = {
        id: crypto.randomUUID(),
        name,
        parentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_FOLDER', folder })
      return folder
    },
    [dispatch]
  )

  const addLink = useCallback(
    (
      title: string,
      url: string,
 
      folderId: string | null = null
    ) => {
      const link: Link = {
        id: crypto.randomUUID(),
        title,
        url,
    
        folderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      dispatch({ type: 'ADD_LINK', link })
      return link
    },
    [dispatch]
  )

  const deleteFolder = useCallback(
    (folderId: string) => {
      dispatch({ type: 'DELETE_FOLDER', folderId })
    },
    [dispatch]
  )

  const deleteLink = useCallback(
    (linkId: string) => {
      dispatch({ type: 'DELETE_LINK', linkId })
    },
    [dispatch]
  )

  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      dispatch({ type: 'RENAME_FOLDER', folderId, name })
    },
    [dispatch]
  )

  const updateLink = useCallback(
    (linkId: string, updates: Partial<Link>) => {
      dispatch({ type: 'UPDATE_LINK', linkId, data: updates })
    },
    [dispatch]
  )

  const moveFolder = useCallback(
    (folderId: string, newParentId: string | null) => {
      dispatch({ type: 'MOVE_FOLDER', folderId, newParentId })
    },
    [dispatch]
  )

  const moveLink = useCallback(
    (linkId: string, newFolderId: string | null) => {
      dispatch({ type: 'MOVE_LINK', linkId, newFolderId })
    },
    [dispatch]
  )

  return {
    data: optimisticData,
    isPending,
    addFolder,
    addLink,
    deleteFolder,
    deleteLink,
    renameFolder,
    updateLink,
    moveFolder,
    moveLink,
  }
}
