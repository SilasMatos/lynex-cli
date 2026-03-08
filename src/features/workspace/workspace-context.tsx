import { getStrictContext } from '#/lib/get-strict-context'
import type { Folder, Link, WorkspaceData } from './types'
import type { ApiWorkspace } from '#/lib/workspace-api'

export type WorkspacePageContextType = {
  data: WorkspaceData
  workspaceId: string | null
  workspaceName: string
  allWorkspaces: ApiWorkspace[]
  isSyncing: boolean
  addFolder: (name: string, parentId?: string | null) => Folder
  addLink: (title: string, url: string, folderId?: string | null) => Link
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
  selectWorkspace: (id: string) => void
  renameWorkspace: (name: string) => void
  createWorkspace: () => Promise<string | null>
}

export const [WorkspacePageProvider, useWorkspacePage] =
  getStrictContext<WorkspacePageContextType>('WorkspacePage')
