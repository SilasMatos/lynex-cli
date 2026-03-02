import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipPanel
} from '@/components/animate-ui/components/base/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import {
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNode,
  TreeNodeContent,
  TreeNodeTrigger,
  TreeProvider,
  TreeView
} from '#/components/kibo-ui/tree'
import {
  ExternalLink,
  Folder,
  FolderPlus,
  Globe,
  Link2,
  Pencil,
  Trash2
} from 'lucide-react'
import { useWorkspace } from './use-workspace'
import type {
  Folder as FolderType,
  Link as LinkType,
  WorkspaceData
} from './types'
import { Label } from '#/components/ui/label'

type WorkspacePageContextType = {
  data: WorkspaceData
  addFolder: (name: string, parentId?: string | null) => FolderType
  addLink: (
    title: string,
    url: string,
    description?: string,
    folderId?: string | null
  ) => LinkType
  deleteFolder: (folderId: string) => void
  deleteLink: (linkId: string) => void
  renameFolder: (folderId: string, name: string) => void
  updateLink: (linkId: string, data: Partial<LinkType>) => void
  renamingFolderId: string | null
  setRenamingFolderId: (id: string | null) => void
  isCreatingFolder: boolean
  creatingFolderParentId: string | null
  startCreatingFolder: (parentId: string | null) => void
  stopCreatingFolder: () => void
  openAddLinkDialog: (folderId: string | null) => void
  openEditLinkDialog: (link: LinkType) => void
  expandFolder: (folderId: string) => void
}

const WorkspacePageContext = createContext<WorkspacePageContextType | null>(
  null
)

function usePageContext() {
  const ctx = useContext(WorkspacePageContext)
  if (!ctx) throw new Error('WorkspacePageContext not found')
  return ctx
}

// ---------------------------------------------------------------------------
// Inline folder‑name input (create & rename)
// ---------------------------------------------------------------------------

function InlineFolderInput({
  level,
  defaultValue = '',
  onSubmit,
  onCancel
}: {
  level: number
  defaultValue?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      if (defaultValue) inputRef.current?.select()
    })
  }, [defaultValue])

  const handleSubmit = () => {
    const name = value.trim()
    if (name) onSubmit(name)
    else onCancel()
  }

  return (
    <div
      className="mx-1 flex items-center rounded-md px-3 py-2"
      style={{ paddingLeft: level * 20 + 8 }}
    >
      <div className="mr-1 h-4 w-4" />
      <div className="mr-2 flex h-4 w-4 items-center justify-center text-muted-foreground">
        <Folder className="h-4 w-4 " />
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={handleSubmit}
        className="flex-1 bg-transparent border-b border-primary/30 outline-none text-sm py-0.5"
        placeholder="Folder name…"
      />
    </div>
  )
}

type LinkDialogState =
  | { open: false }
  | { open: true; mode: 'add'; folderId: string | null }
  | { open: true; mode: 'edit'; link: LinkType }

function LinkDialog({
  state,
  onClose
}: {
  state: LinkDialogState
  onClose: () => void
}) {
  const { addLink, updateLink } = usePageContext()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!state.open) return
    if (state.mode === 'edit') {
      setTitle(state.link.title)
      setUrl(state.link.url)
      setDescription(state.link.description)
    } else {
      setTitle('')
      setUrl('')
      setDescription('')
    }
  }, [state])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return

    if (state.open && state.mode === 'add') {
      addLink(title.trim(), url.trim(), description.trim(), state.folderId)
    } else if (state.open && state.mode === 'edit') {
      updateLink(state.link.id, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim()
      })
    }
    onClose()
  }

  return (
    <Dialog open={state.open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state.open && state.mode === 'edit' ? 'Edit Link' : 'New Link'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor="link-title">Title</Label>
          <Input
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <Label htmlFor="link-url">URL</Label>
          <Input
            placeholder="https://…"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <Label htmlFor="link-description">Description</Label>
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {state.open && state.mode === 'edit' ? 'Save' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FolderTreeNode({
  folder,
  level,
  isLast
}: {
  folder: FolderType
  level: number
  isLast?: boolean
}) {
  const {
    data,
    addFolder,
    deleteFolder,
    renameFolder,
    renamingFolderId,
    setRenamingFolderId,
    isCreatingFolder,
    creatingFolderParentId,
    startCreatingFolder,
    stopCreatingFolder,
    openAddLinkDialog,
    expandFolder
  } = usePageContext()

  const childFolders = data.folders.filter(f => f.parentId === folder.id)
  const childLinks = data.links.filter(l => l.folderId === folder.id)
  const isCreatingHere =
    isCreatingFolder && creatingFolderParentId === folder.id
  const isRenaming = renamingFolderId === folder.id

  const handleRename = (value: string) => {
    const name = value.trim()
    if (name && name !== folder.name) {
      renameFolder(folder.id, name)
    }
    setRenamingFolderId(null)
  }

  const handleCreateSubfolder = (name: string) => {
    const newFolder = addFolder(name, folder.id)
    expandFolder(folder.id)
    expandFolder(newFolder.id)
    stopCreatingFolder()
  }

  return (
    <TreeNode nodeId={folder.id} level={level} isLast={isLast}>
      <TreeNodeTrigger>
        <TreeExpander hasChildren />
        <TreeIcon hasChildren icon={<Folder className="h-4 w-4 " />} />

        {isRenaming ? (
          <input
            autoFocus
            defaultValue={folder.name}
            className="flex-1 bg-transparent border-b border-primary/30 outline-none text-sm py-0.5"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === 'Enter')
                handleRename((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setRenamingFolderId(null)
            }}
            onBlur={e => handleRename(e.target.value)}
          />
        ) : (
          <TreeLabel className="font-medium">{folder.name}</TreeLabel>
        )}

        <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger>
              <Button
                className=""
                onClick={e => {
                  e.stopPropagation()
                  startCreatingFolder(folder.id)
                  expandFolder(folder.id)
                }}
                variant="outline"
                size="icon"
              >
                <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipPanel>Nova pasta</TooltipPanel>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={e => {
                  e.stopPropagation()
                  openAddLinkDialog(folder.id)
                  expandFolder(folder.id)
                }}
                title="Add link"
                variant="outline"
                size="icon"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipPanel>Novo Link</TooltipPanel>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={e => {
                  e.stopPropagation()
                  setRenamingFolderId(folder.id)
                }}
                title="Rename"
                variant="outline"
                size="icon"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipPanel>Editar</TooltipPanel>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                className="hover:text-destructive"
                onClick={e => {
                  e.stopPropagation()
                  deleteFolder(folder.id)
                }}
                title="Delete"
                variant="outline"
                size="icon"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipPanel>Deletar</TooltipPanel>
          </Tooltip>
        </div>
      </TreeNodeTrigger>

      <TreeNodeContent hasChildren>
        {childFolders.map((child, i) => (
          <FolderTreeNode
            key={child.id}
            folder={child}
            level={level + 1}
            isLast={
              i === childFolders.length - 1 &&
              childLinks.length === 0 &&
              !isCreatingHere
            }
          />
        ))}
        {childLinks.map((link, i) => (
          <LinkTreeNode
            key={link.id}
            link={link}
            level={level + 1}
            isLast={i === childLinks.length - 1 && !isCreatingHere}
          />
        ))}
        {isCreatingHere && (
          <InlineFolderInput
            level={level + 1}
            onSubmit={handleCreateSubfolder}
            onCancel={stopCreatingFolder}
          />
        )}
      </TreeNodeContent>
    </TreeNode>
  )
}

function LinkTreeNode({
  link,
  level,
  isLast
}: {
  link: LinkType
  level: number
  isLast?: boolean
}) {
  const { deleteLink, openEditLinkDialog } = usePageContext()

  return (
    <TreeNode nodeId={link.id} level={level} isLast={isLast}>
      <TreeNodeTrigger>
        <TreeExpander />
        <TreeIcon icon={<Globe className="h-4 w-4 " />} />
        <TreeLabel>{link.title}</TreeLabel>

        {/* {link.description && (
          <span className="ml-2 hidden text-xs text-muted-foreground sm:inline truncate max-w-45">
            {link.description}
          </span>
        )} */}

        <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="icon"
                onClick={e => {
                  e.stopPropagation()
                  window.open(link.url, '_blank', 'noopener,noreferrer')
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipPanel>Abrir Link</TooltipPanel>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={e => {
                  e.stopPropagation()
                  openEditLinkDialog(link)
                }}
                title="Edit"
                variant="outline"
                size="icon"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipPanel>Editar</TooltipPanel>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={e => {
                  e.stopPropagation()
                  deleteLink(link.id)
                }}
                title="Delete"
                variant="outline"
                size="icon"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>

            <TooltipPanel>Deletar</TooltipPanel>
          </Tooltip>
        </div>
      </TreeNodeTrigger>
    </TreeNode>
  )
}

function EmptyState({ onCreateFolder }: { onCreateFolder: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <FolderPlus className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-medium">No folders yet</h3>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        Create your first folder to start organizing your links.
      </p>
      <Button onClick={onCreateFolder}>
        <FolderPlus className="mr-2 h-4 w-4" />
        Create Folder
      </Button>
    </div>
  )
}

export function WorkspacePage() {
  const workspace = useWorkspace()
  const {
    data,
    addFolder,
    addLink,
    deleteFolder,
    deleteLink,
    renameFolder,
    updateLink
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

  const contextValue: WorkspacePageContextType = {
    data,
    addFolder,
    addLink,
    deleteFolder,
    deleteLink,
    renameFolder,
    updateLink,
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
    <WorkspacePageContext.Provider value={contextValue}>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">My Links</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddLinkDialog(null)}
            >
              <Link2 className="mr-2 h-4 w-4" />
              New Link
            </Button>
            <Button size="sm" onClick={() => startCreatingFolder(null)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
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
          </TreeProvider>
        )}

        {/* Link dialog (shared across all nodes) */}
        <LinkDialog state={linkDialogState} onClose={closeLinkDialog} />
      </div>
    </WorkspacePageContext.Provider>
  )
}
