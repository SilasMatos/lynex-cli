import { useCallback } from 'react'
import { TreeProvider, TreeView } from '#/components/kibo-ui/tree'
import { useWorkspacePage } from '../workspace-context'
import { FolderTreeNode } from './folder-tree-node'
import { InlineFolderInput } from './inline-folder-input'
import { LinkTreeNode } from './link-tree-node'
import { RootDropZone } from './root-drop-zone'
import { EmptyState } from './empty-state'

export interface WorkspaceTreeProps {
  expandedIds: string[]
  onExpandChange: (ids: string[]) => void
}

export function WorkspaceTree({ expandedIds, onExpandChange }: WorkspaceTreeProps) {
  const {
    data,
    isCreatingFolder,
    creatingFolderParentId,
    addFolder,
    expandFolder,
    stopCreatingFolder,
    startCreatingFolder
  } = useWorkspacePage()

  const rootFolders = data.folders.filter(f => f.parentId === null)
  const rootLinks = data.links.filter(l => l.folderId === null)
  const isCreatingAtRoot = isCreatingFolder && creatingFolderParentId === null
  const isEmpty =
    rootFolders.length === 0 && rootLinks.length === 0 && !isCreatingFolder

  const handleCreateRootFolder = useCallback(
    (name: string) => {
      const folder = addFolder(name, null)
      expandFolder(folder.id)
      stopCreatingFolder()
    },
    [addFolder, expandFolder, stopCreatingFolder]
  )

  if (isEmpty) {
    return (
      <div data-slot="workspace-tree">
        <EmptyState onCreateFolder={() => startCreatingFolder(null)} />
      </div>
    )
  }

  return (
    <div data-slot="workspace-tree">
      <TreeProvider
        expandedIds={expandedIds}
        onExpandChange={onExpandChange}
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
    </div>
  )
}
