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
  description: string
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
