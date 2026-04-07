import type { ComponentProps } from 'react'
import { Button } from '#/components/ui/button'
import { twMerge } from 'tailwind-merge'
import { Trash2 } from 'lucide-react'

export interface DeleteWorkspaceActionBarProps extends ComponentProps<'div'> {
  workspaceName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}

export function DeleteWorkspaceActionBar({
  workspaceName,
  onConfirm,
  onCancel,
  isDeleting = false,
  className,
  ...props
}: DeleteWorkspaceActionBarProps) {
  return (
    <div
      data-slot="delete-workspace-action-bar"
      role="dialog"
      aria-label="Confirmar exclusão do workspace"
      className={twMerge(
        'fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3 shadow-lg',
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Trash2 className="size-4 text-destructive" aria-hidden />
        Excluir &quot;{workspaceName}&quot;?
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Excluindo…' : 'Excluir'}
        </Button>
      </div>
    </div>
  )
}
