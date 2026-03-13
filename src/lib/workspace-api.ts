const BASE_URL = ''

export type ApiFolder = {
  id: string
  name: string
  parentId: string | null
}

export type ApiLink = {
  id: string
  title: string
  url: string
  folderId: string | null
}

export type ApiWorkspace = {
  id: string
  name: string
  folders: ApiFolder[]
  links: ApiLink[]
}

export type SyncResult = {
  workspaceId: string
}

export async function syncWorkspace(payload: {
  id?: string
  name: string
  folders: Array<{ id?: string; name: string; parentId: string | null }>
  links: Array<{ id?: string; title: string; url: string; folderId: string | null }>
}): Promise<SyncResult> {
  const res = await fetch(`${BASE_URL}/workspaces/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to sync workspace')
  return res.json()
}

export async function listWorkspaces(): Promise<ApiWorkspace[]> {
  const res = await fetch(`${BASE_URL}/workspaces/`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch workspaces')
  return res.json()
}

export async function getWorkspace(workspaceId: string): Promise<ApiWorkspace> {
  const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}`)
  if (!res.ok) throw new Error('Workspace not found')
  return res.json()
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/workspaces/${workspaceId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete workspace')
}
