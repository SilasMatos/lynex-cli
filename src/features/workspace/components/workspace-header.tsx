import { useCallback, useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '#/components/ui/popover'
import {
  Check,
  ChevronDown,
  FileJson,
  FolderPlus,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { cn } from '#/lib/utils'
import { useWorkspacePage } from '../workspace-context'
import { ShareButton } from './share-button'

export interface WorkspaceHeaderProps {
  onOpenCreateFromJson?: () => void
}

export function WorkspaceHeader({
  onOpenCreateFromJson
}: WorkspaceHeaderProps = {}) {
  const {
    workspaceName,
    workspaceId,
    allWorkspaces,
    isSyncing,
    selectWorkspace,
    renameWorkspace,
    createWorkspace,
    deleteWorkspace,
    openAddLinkDialog,
    startCreatingFolder
  } = useWorkspacePage()

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

  return (
    <div
      data-slot="workspace-header"
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-2">
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
            type="button"
            className="flex items-center gap-1.5 text-lg font-semibold tracking-tight transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setNameInput(workspaceName)
              setEditingName(true)
            }}
          >
            {workspaceName}
            <Pencil className="size-3.5 text-muted-foreground" aria-hidden />
          </button>
        )}

        <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-6"
              aria-label="Trocar workspace"
            >
              <ChevronDown className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[calc(100vw-2rem)] max-w-56 p-2 sm:w-56"
          >
            <div className="flex max-h-[min(70vh,20rem)] flex-col gap-0.5 overflow-y-auto">
              {allWorkspaces.map(ws => (
                <div
                  key={ws.id}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                    ws.id === workspaceId && 'bg-accent'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      selectWorkspace(ws.id)
                      setSwitcherOpen(false)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left transition-colors hover:bg-accent"
                  >
                    <span className="flex size-3.5 shrink-0 items-center justify-center">
                      {ws.id === workspaceId && (
                        <Check className="size-3.5" aria-hidden />
                      )}
                    </span>
                    <span className="truncate">{ws.name}</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Excluir workspace ${ws.name}`}
                    onClick={e => {
                      e.stopPropagation()
                      if (
                        window.confirm(
                          `Excluir o workspace "${ws.name}"? Esta ação não pode ser desfeita.`
                        )
                      ) {
                        deleteWorkspace(ws.id)
                        setSwitcherOpen(false)
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  const newId = await createWorkspace()
                  setSwitcherOpen(false)
                  if (newId) {
                    setNameInput('Novo Workspace')
                    setEditingName(true)
                  }
                }}
                className="mt-1 w-full"
              >
                <Plus aria-hidden /> Novo Workspace
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {isSyncing && (
          <RefreshCw
            className="size-3.5 animate-spin text-muted-foreground"
            aria-label="Sincronizando"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {onOpenCreateFromJson && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCreateFromJson}
            aria-label="Criar workspace a partir de JSON"
          >
            <FileJson className="size-4" aria-hidden />
            Criar por JSON
          </Button>
        )}
        <ShareButton />
        <Button
          variant="outline"
          size="sm"
          onClick={() => openAddLinkDialog(null)}
        >
          <Link2 className="size-4" aria-hidden />
          Novo Link
        </Button>
        <Button size="sm" onClick={() => startCreatingFolder(null)}>
          <FolderPlus className="size-4" aria-hidden />
          Nova Pasta
        </Button>
      </div>
    </div>
  )
}
