import { useCallback, useEffect, useRef, useState } from 'react'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Skeleton } from '#/components/ui/skeleton'

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '#/components/ui/popover'
import { TreeProvider, TreeView } from '#/components/kibo-ui/tree'
import {
  Check,
  ChevronDown,
  FolderPlus,
  Link2,
  Pencil,
  RefreshCw,
  Plus
} from 'lucide-react'
import { cn } from '#/lib/utils'
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
import { ShareButton } from './components/share-button'

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <Skeleton className="size-4 rounded" />
          <Skeleton
            className="h-4 rounded"
            style={{ width: `${60 + i * 20}px` }}
          />
        </div>
      ))}
    </div>
  )
}

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
    createWorkspace
  } = workspace

  const [expandedIds, setExpandedIds] = useState<string[]>(() =>
    data.folders.map(f => f.id)
  )
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(workspaceName)
  const [switcherOpen, setSwitcherOpen] = useState(false)

  useEffect(() => {
    setNameInput(workspaceName)
  }, [workspaceName])

  const handleNameSubmit = useCallback(() => {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== workspaceName) renameWorkspace(trimmed)
    setEditingName(false)
  }, [nameInput, workspaceName, renameWorkspace])
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
    createWorkspace
  }

  return (
    <WorkspacePageProvider value={contextValue}>
      <DragDropProvider onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div data-slot="workspace-page">
          <div className="mb-6 flex items-center justify-between ">
            <div className="flex items-center gap-2">
              {editingName ? (
                <Input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleNameSubmit()
                    if (e.key === 'Escape') {
                      setNameInput(workspaceName)
                      setEditingName(false)
                    }
                  }}
                  className="h-7 w-48 px-2 text-base font-semibold"
                />
              ) : (
                <button
                  className="flex items-center gap-1.5 text-lg font-semibold tracking-tight hover:opacity-70 transition-opacity"
                  onClick={() => {
                    setNameInput(workspaceName)
                    setEditingName(true)
                  }}
                >
                  {workspaceName}

                  <Pencil className="size-3.5 text-muted-foreground" />
                </button>
              )}
              {allWorkspaces.length >= 1 && (
                <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="size-6">
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-56 p-1">
                    <div className="flex flex-col gap-0.5">
                      {allWorkspaces.map(ws => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            selectWorkspace(ws.id)
                            setSwitcherOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left',
                            ws.id === workspaceId && 'bg-accent'
                          )}
                        >
                          <span className="flex size-3.5 shrink-0 items-center justify-center">
                            {ws.id === workspaceId && (
                              <Check className="size-3.5" />
                            )}
                          </span>
                          {ws.name}
                        </button>
                      ))}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const newId = await createWorkspace()
                          setSwitcherOpen(false)
                          if (newId) {
                            setNameInput('Novo Workspace')
                            setEditingName(true)
                          }
                        }}
                        className="w-full mt-1"
                      >
                        <Plus /> Novo Workspace
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {isSyncing && (
                <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex gap-2">
              <ShareButton />
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAddLinkDialog(null)}
              >
                <Link2 className="size-4" />
                Novo Link
              </Button>
              <Button size="sm" onClick={() => startCreatingFolder(null)}>
                <FolderPlus className="size-4" />
                Nova Pasta
              </Button>
            </div>
          </div>

          {isLoading ? (
            <WorkspaceSkeleton />
          ) : isEmpty ? (
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
