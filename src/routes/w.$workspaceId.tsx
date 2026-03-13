import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getWorkspace } from '#/lib/workspace-api'
import type { ApiWorkspace, ApiFolder, ApiLink } from '#/lib/workspace-api'
import { Skeleton } from '#/components/ui/skeleton'
import { Folder, Link2, ChevronRight } from 'lucide-react'

export const Route = createFileRoute('/w/$workspaceId')({
  component: SharedWorkspacePage
})

function SharedWorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton
            className="h-4 rounded"
            style={{ width: `${80 + i * 25}px` }}
          />
        </div>
      ))}
    </div>
  )
}

function FolderSection({
  folder,
  allFolders,
  allLinks,
  depth = 0
}: {
  folder: ApiFolder
  allFolders: ApiFolder[]
  allLinks: ApiLink[]
  depth?: number
}) {
  const [open, setOpen] = useState(true)
  const children = allFolders.filter(f => f.parentId === folder.id)
  const links = allLinks.filter(l => l.folderId === folder.id)

  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 16}px` : undefined }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-1.5 rounded py-1 px-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
      >
        <ChevronRight
          className={`size-3.5 shrink-0 text-white/40 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <Folder className="size-3.5 shrink-0 text-white/50" />
        <span className="truncate font-medium">{folder.name}</span>
      </button>

      {open && (
        <div>
          {children.map(child => (
            <FolderSection
              key={child.id}
              folder={child}
              allFolders={allFolders}
              allLinks={allLinks}
              depth={depth + 1}
            />
          ))}
          {links.map(link => (
            <LinkItem key={link.id} link={link} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function LinkItem({ link, depth = 0 }: { link: ApiLink; depth?: number }) {
  return (
    <div style={{ paddingLeft: `${depth * 16 + 8}px` }}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded py-1 px-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors group"
      >
        <Link2 className="size-3.5 shrink-0 text-white/40 group-hover:text-white/60" />
        <span className="truncate">{link.title}</span>
      </a>
    </div>
  )
}

function getWorkspaceDisplayName(workspace: ApiWorkspace | null): string {
  if (!workspace) return 'Workspace'
  const w = workspace as ApiWorkspace & { title?: string }
  return w.name?.trim() || w.title?.trim() || 'Workspace'
}

function SharedWorkspacePage() {
  const { workspaceId } = Route.useParams()
  const [workspace, setWorkspace] = useState<ApiWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getWorkspace(workspaceId)
      .then(setWorkspace)
      .catch(() => setError('Workspace não encontrado ou não disponível.'))
      .finally(() => setIsLoading(false))
  }, [workspaceId])

  useEffect(() => {
    if (workspace) {
      const name = getWorkspaceDisplayName(workspace)
      document.title = name !== 'Workspace' ? `${name} · Lynex` : 'Lynex'
    }
    return () => {
      document.title = 'Lynex'
    }
  }, [workspace])

  const rootFolders = workspace?.folders.filter(f => f.parentId === null) ?? []
  const rootLinks = workspace?.links.filter(l => l.folderId === null) ?? []
  const displayName = getWorkspaceDisplayName(workspace)

  return (
    <div className="min-h-screen w-full  relative overflow-hidden">
      <div className="relative z-10">
        <div className="mx-auto w-full max-w-4xl px-6 lg:px-12 my-4">
          <div className="mb-6">
            {isLoading ? (
              <Skeleton className="h-7 w-48 mb-1" />
            ) : (
              <h1 className="text-xl font-semibold tracking-tight" title={displayName}>
                {displayName}
              </h1>
            )}
            <p className="text-sm text-white/40 mt-1">
              Workspace compartilhado · somente leitura
            </p>
          </div>

          {isLoading && <SharedWorkspaceSkeleton />}

          {error && <p className="text-sm text-red-400">{error}</p>}

          {!isLoading && !error && workspace && (
            <div className="flex flex-col">
              {rootFolders.map(folder => (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  allFolders={workspace.folders}
                  allLinks={workspace.links}
                />
              ))}
              {rootLinks.map(link => (
                <LinkItem key={link.id} link={link} />
              ))}
              {rootFolders.length === 0 && rootLinks.length === 0 && (
                <p className="text-sm text-white/40">
                  Este workspace está vazio.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
