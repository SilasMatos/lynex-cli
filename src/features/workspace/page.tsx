import { useCallback, useRef, useState } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { useWorkspace } from '@/features/workspace/hooks/use-workspace'
import type {
  Link as LinkType,
  DndItemData,
  DndDropData,
  LinkDialogState
} from './types'
import { WorkspacePageProvider } from './workspace-context'
import type { WorkspacePageContextType } from './workspace-context'
import { CreateWorkspaceFromJsonDialog } from './components/create-workspace-from-json-dialog'
import { DragOverlayContent } from './components/drag-overlay-content'
import { LinkDialog } from './components/link-dialog'
import { WorkspaceHeader } from './components/workspace-header'
import { WorkspaceSkeleton } from './components/workspace-skeleton'
import { WorkspaceTree } from './components/workspace-tree'

export function WorkspacePage() {
  const workspace = useWorkspace()
  const {
    data,
    workspaceId,
    workspaceName,
    allWorkspaces,
    isLoading,
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
    deleteWorkspace
  } = workspace

  const [expandedIds, setExpandedIds] = useState<string[]>(() =>
    data.folders.map(f => f.id)
  )
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [creatingFolderParentId, setCreatingFolderParentId] = useState<
    string | null
  >(null)
  const [linkDialogState, setLinkDialogState] = useState<LinkDialogState>({
    open: false
  })
  const [createFromJsonOpen, setCreateFromJsonOpen] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const expandFolder = useCallback((folderId: string) => {
    setExpandedIds(prev =>
      prev.includes(folderId) ? prev : [...prev, folderId]
    )
  }, [])

  const startCreatingFolder = useCallback((parentId: string | null) => {
    setCreatingFolderParentId(parentId)
    setIsCreatingFolder(true)
  }, [])

  const stopCreatingFolder = useCallback(() => {
    setIsCreatingFolder(false)
  }, [])

  const openAddLinkDialog = useCallback((folderId: string | null) => {
    setLinkDialogState({ open: true, mode: 'add', folderId })
  }, [])

  const openEditLinkDialog = useCallback((link: LinkType) => {
    setLinkDialogState({ open: true, mode: 'edit', link })
  }, [])

  const closeLinkDialog = useCallback(() => {
    setLinkDialogState({ open: false })
  }, [])

  const handleDragEnd = useCallback(
    (event: {
      canceled: boolean
      operation: {
        source: { data: unknown } | null
        target: { data: unknown } | null
      }
    }) => {
      clearTimeout(hoverTimerRef.current)
      if (event.canceled) return

      const source = event.operation.source
      const target = event.operation.target
      if (!source || !target) return

      const sourceData = source.data as DndItemData
      const targetData = target.data as DndDropData
      const targetId = targetData.type === 'folder' ? targetData.id : null

      if (sourceData.type === 'folder') {
        const folder = data.folders.find(f => f.id === sourceData.id)
        if (
          folder &&
          folder.parentId !== targetId &&
          sourceData.id !== targetId
        ) {
          moveFolder(sourceData.id, targetId)
          if (targetId) expandFolder(targetId)
        }
      } else if (sourceData.type === 'link') {
        const link = data.links.find(l => l.id === sourceData.id)
        if (link && link.folderId !== targetId) {
          moveLink(sourceData.id, targetId)
          if (targetId) expandFolder(targetId)
        }
      }
    },
    [data, moveFolder, moveLink, expandFolder]
  )

  const handleDragOver = useCallback(
    (event: {
      operation: { target: { data: unknown } | null }
    }) => {
      clearTimeout(hoverTimerRef.current)
      const target = event.operation.target
      if (!target) return
      const targetData = target.data as DndDropData
      if (targetData.type === 'folder') {
        hoverTimerRef.current = setTimeout(() => {
          expandFolder(targetData.id)
        }, 600)
      }
    },
    [expandFolder]
  )

  const contextValue: WorkspacePageContextType = {
    data,
    workspaceId,
    workspaceName,
    allWorkspaces,
    isSyncing,
    addFolder,
    addLink,
    deleteFolder,
    deleteLink,
    renameFolder,
    updateLink,
    moveFolder,
    moveLink,
    renamingFolderId,
    setRenamingFolderId,
    isCreatingFolder,
    creatingFolderParentId,
    startCreatingFolder,
    stopCreatingFolder,
    openAddLinkDialog,
    openEditLinkDialog,
    expandFolder,
    selectWorkspace,
    renameWorkspace,
    createWorkspace,
    deleteWorkspace
  }

  return (
    <WorkspacePageProvider value={contextValue}>
      <DragDropProvider onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div data-slot="workspace-page">
          <WorkspaceHeader onOpenCreateFromJson={() => setCreateFromJsonOpen(true)} />

          {isLoading ? (
            <WorkspaceSkeleton />
          ) : (
            <WorkspaceTree
              expandedIds={expandedIds}
              onExpandChange={setExpandedIds}
            />
          )}

          <DragOverlay>
            <DragOverlayContent />
          </DragOverlay>

          <LinkDialog state={linkDialogState} onClose={closeLinkDialog} />
          <CreateWorkspaceFromJsonDialog
            open={createFromJsonOpen}
            onOpenChange={setCreateFromJsonOpen}
          />
        </div>
      </DragDropProvider>
    </WorkspacePageProvider>
  )
}
