import { useDraggable, useDroppable } from '@dnd-kit/react'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipPanel
} from '@/components/animate-ui/components/base/tooltip'
import {
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNode,
  TreeNodeContent,
  TreeNodeTrigger
} from '#/components/kibo-ui/tree'
import { FolderPlus, Link2, Pencil, Trash2 } from 'lucide-react'
import { cn } from '#/lib/utils'
import { useWorkspacePage } from '../workspace-context'
import type { Folder, DndItemData, DndDropData } from '../types'
import { LinkTreeNode } from './link-tree-node'
import { InlineFolderInput } from './inline-folder-input'

export interface FolderTreeNodeProps {
  folder: Folder
  level: number
  isLast?: boolean
  parentPath?: boolean[]
}

export function FolderTreeNode({
  folder,
  level,
  isLast,
  parentPath
}: FolderTreeNodeProps) {
  const {
    data,
    deleteFolder,
    renameFolder,
    renamingFolderId,
    setRenamingFolderId,
    isCreatingFolder,
    creatingFolderParentId,
    startCreatingFolder,
    stopCreatingFolder,
    addFolder,
    expandFolder,
    openAddLinkDialog
  } = useWorkspacePage()

  const childFolders = data.folders.filter(f => f.parentId === folder.id)
  const childLinks = data.links.filter(l => l.folderId === folder.id)
  const isCreatingChildFolder =
    isCreatingFolder && creatingFolderParentId === folder.id
  const hasChildren =
    childFolders.length > 0 || childLinks.length > 0 || isCreatingChildFolder
  const isRenaming = renamingFolderId === folder.id

  const { ref: dragRef, isDragging } = useDraggable({
    id: `drag-folder-${folder.id}`,
    data: {
      type: 'folder',
      id: folder.id,
      name: folder.name
    } satisfies DndItemData
  })

  const { ref: dropRef, isDropTarget } = useDroppable({
    id: `drop-folder-${folder.id}`,
    data: { type: 'folder', id: folder.id } satisfies DndDropData
  })

  const handleRename = (name: string) => {
    renameFolder(folder.id, name)
    setRenamingFolderId(null)
  }

  const handleCreateChildFolder = (name: string) => {
    const newFolder = addFolder(name, folder.id)
    expandFolder(newFolder.id)
    stopCreatingFolder()
  }

  return (
    <div
      ref={el => {
        dragRef(el)
        dropRef(el)
      }}
      data-slot="folder-tree-node"
      className={cn(
        'rounded-md transition-all duration-200',
        isDragging && 'opacity-40',
        isDropTarget && 'ring-2 ring-primary/40'
      )}
    >
      <TreeNode
        nodeId={folder.id}
        level={level}
        isLast={isLast}
        parentPath={parentPath}
      >
        {isRenaming ? (
          <InlineFolderInput
            level={level}
            defaultValue={folder.name}
            onSubmit={handleRename}
            onCancel={() => setRenamingFolderId(null)}
          />
        ) : (
          <TreeNodeTrigger>
            <TreeExpander hasChildren={hasChildren} />
            <TreeIcon hasChildren />
            <TreeLabel>{folder.name}</TreeLabel>

            <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    aria-label="Adicionar link"
                    variant="outline"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation()
                      openAddLinkDialog(folder.id)
                    }}
                  >
                    <Link2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipPanel>Adicionar Link</TooltipPanel>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Button
                    aria-label="Nova subpasta"
                    variant="outline"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation()
                      expandFolder(folder.id)
                      startCreatingFolder(folder.id)
                    }}
                  >
                    <FolderPlus className="size-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipPanel>Nova Subpasta</TooltipPanel>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Button
                    aria-label="Renomear pasta"
                    variant="outline"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation()
                      setRenamingFolderId(folder.id)
                    }}
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipPanel>Renomear</TooltipPanel>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Button
                    aria-label="Deletar pasta"
                    variant="outline"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation()
                      deleteFolder(folder.id)
                    }}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipPanel>Deletar</TooltipPanel>
              </Tooltip>
            </div>
          </TreeNodeTrigger>
        )}

        <TreeNodeContent hasChildren={hasChildren}>
          {childFolders.map((child, i) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              level={level + 1}
              isLast={
                i === childFolders.length - 1 &&
                childLinks.length === 0 &&
                !isCreatingChildFolder
              }
            />
          ))}
          {childLinks.map((link, i) => (
            <LinkTreeNode
              key={link.id}
              link={link}
              level={level + 1}
              isLast={i === childLinks.length - 1 && !isCreatingChildFolder}
            />
          ))}
          {isCreatingChildFolder && (
            <InlineFolderInput
              level={level + 1}
              onSubmit={handleCreateChildFolder}
              onCancel={stopCreatingFolder}
            />
          )}
        </TreeNodeContent>
      </TreeNode>
    </div>
  )
}
