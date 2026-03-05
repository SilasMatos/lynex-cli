export type Folder = {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export type Link = {
  id: string
  title: string
  url: string

  folderId: string | null
  createdAt: string
  updatedAt: string
}

export type WorkspaceData = {
  folders: Folder[]
  links: Link[]
}

export type WorkspaceAction =
  | { type: 'ADD_FOLDER'; folder: Folder }
  | { type: 'ADD_LINK'; link: Link }
  | { type: 'DELETE_FOLDER'; folderId: string }
  | { type: 'DELETE_LINK'; linkId: string }
  | { type: 'RENAME_FOLDER'; folderId: string; name: string }
  | { type: 'UPDATE_LINK'; linkId: string; data: Partial<Link> }

export type DndItemData =
  | { type: 'folder'; id: string; name: string }
  | { type: 'link'; id: string; name: string }

export type DndDropData =
  | { type: 'folder'; id: string }
  | { type: 'root'; id: string }

export type LinkDialogState =
  | { open: false }
  | { open: true; mode: 'add'; folderId: string | null }
  | { open: true; mode: 'edit'; link: Link }
