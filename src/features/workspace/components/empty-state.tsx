import { Button } from '#/components/ui/button'
import { FolderPlus } from 'lucide-react'

export interface EmptyStateProps {
  onCreateFolder: () => void
}

export function EmptyState({ onCreateFolder }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <FolderPlus className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-medium">Nenhuma pasta ainda</h3>
      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        Crie sua primeira pasta para começar a organizar seus links.
      </p>
      <Button onClick={onCreateFolder}>
        <FolderPlus className="mr-2 size-4" />
        Criar Pasta
      </Button>
    </div>
  )
}
