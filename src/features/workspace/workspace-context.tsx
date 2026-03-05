import { getStrictContext } from '#/lib/get-strict-context'
import type { Folder, Link, WorkspaceData } from './types'

export type WorkspacePageContextType = {
  data: WorkspaceData
  addFolder: (name: string, parentId?: string | null) => Folder
  addLink: (
    title: string,
    url: string,

    folderId?: string | null
  ) => Link
  deleteFolder: (folderId: string) => void
  deleteLink: (linkId: string) => void
  renameFolder: (folderId: string, name: string) => void
  updateLink: (linkId: string, data: Partial<Link>) => void
  moveFolder: (folderId: string, newParentId: string | null) => void
  moveLink: (linkId: string, newFolderId: string | null) => void
  renamingFolderId: string | null
  setRenamingFolderId: (id: string | null) => void
  isCreatingFolder: boolean
  creatingFolderParentId: string | null
  startCreatingFolder: (parentId: string | null) => void
  stopCreatingFolder: () => void
  openAddLinkDialog: (folderId: string | null) => void
  openEditLinkDialog: (link: Link) => void
  expandFolder: (folderId: string) => void
}

export const [WorkspacePageProvider, useWorkspacePage] =
  getStrictContext<WorkspacePageContextType>('WorkspacePage')
