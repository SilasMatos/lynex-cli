import { useCallback, useRef, useState } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { Button } from '#/components/ui/button'
import { TreeProvider, TreeView } from '#/components/kibo-ui/tree'
import { FolderPlus, Link2 } from 'lucide-react'
import { useWorkspace } from '@/features/workspace/hooks/use-workspace'
import type {
  Link as LinkType,
  DndItemData,
  DndDropData,
  LinkDialogState
} from './types'
import { WorkspacePageProvider } from './workspace-context'
import type { WorkspacePageContextType } from './workspace-context'
import { FolderTreeNode } from './components/folder-tree-node'
import { LinkTreeNode } from './components/link-tree-node'
import { InlineFolderInput } from './components/inline-folder-input'
import { LinkDialog } from './components/link-dialog'
import { RootDropZone } from './components/root-drop-zone'
import { DragOverlayContent } from './components/drag-overlay-content'
import { EmptyState } from './components/empty-state'

export function WorkspacePage() {
  const workspace = useWorkspace()
  const {
    data,
    addFolder,
    addLink,
    deleteFolder,
    deleteLink,
    renameFolder,
    updateLink,
    moveFolder,
    moveLink
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
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const rootFolders = data.folders.filter(f => f.parentId === null)
  const rootLinks = data.links.filter(l => l.folderId === null)
  const isCreatingAtRoot = isCreatingFolder && creatingFolderParentId === null
  const isEmpty =
    rootFolders.length === 0 && rootLinks.length === 0 && !isCreatingFolder

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

  const handleCreateRootFolder = useCallback(
    (name: string) => {
      const folder = addFolder(name, null)
      expandFolder(folder.id)
      setIsCreatingFolder(false)
    },
    [addFolder, expandFolder]
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = useCallback(
    (event: any) => {
      clearTimeout(hoverTimerRef.current)
      if (event.canceled) return

      const source = event.operation?.source
      const target = event.operation?.target
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
    (event: any) => {
      clearTimeout(hoverTimerRef.current)
      const target = event.operation?.target
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
    expandFolder
  }

  return (
    <WorkspacePageProvider value={contextValue}>
      <DragDropProvider onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div data-slot="workspace-page">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Workspace</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAddLinkDialog(null)}
              >
                <Link2 className="mr-2 size-4" />
                Novo Link
              </Button>
              <Button size="sm" onClick={() => startCreatingFolder(null)}>
                <FolderPlus className="mr-2 size-4" />
                Nova Pasta
              </Button>
            </div>
          </div>

          {isEmpty ? (
            <EmptyState onCreateFolder={() => startCreatingFolder(null)} />
          ) : (
            <TreeProvider
              expandedIds={expandedIds}
              onExpandChange={setExpandedIds}
              showLines
              showIcons
              selectable={false}
            >
              <TreeView>
                {rootFolders.map((folder, i) => (
                  <FolderTreeNode
                    key={folder.id}
                    folder={folder}
                    level={0}
                    isLast={
                      i === rootFolders.length - 1 &&
                      rootLinks.length === 0 &&
                      !isCreatingAtRoot
                    }
                  />
                ))}
                {rootLinks.map((link, i) => (
                  <LinkTreeNode
                    key={link.id}
                    link={link}
                    level={0}
                    isLast={i === rootLinks.length - 1 && !isCreatingAtRoot}
                  />
                ))}
                {isCreatingAtRoot && (
                  <InlineFolderInput
                    level={0}
                    onSubmit={handleCreateRootFolder}
                    onCancel={stopCreatingFolder}
                  />
                )}
              </TreeView>
              <RootDropZone />
            </TreeProvider>
          )}

          <DragOverlay>
            <DragOverlayContent />
          </DragOverlay>

          <LinkDialog state={linkDialogState} onClose={closeLinkDialog} />
        </div>
      </DragDropProvider>
    </WorkspacePageProvider>
  )
}
