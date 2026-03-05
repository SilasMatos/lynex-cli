import { useDroppable } from '@dnd-kit/react'
import { cn } from '#/lib/utils'
import type { DndDropData } from '../types'

export function RootDropZone() {
  const { ref, isDropTarget } = useDroppable({
    id: 'drop-root',
    data: { type: 'root', id: 'root' } satisfies DndDropData
  })

  return (
    <div
      ref={ref}
      data-slot="root-drop-zone"
      className={cn(
        'mt-1 rounded-md border border-dashed p-2 text-center text-xs text-muted-foreground transition-colors duration-200',
        isDropTarget
          ? 'border-primary/50 bg-primary/5 text-primary'
          : 'border-transparent'
      )}
    >
      {isDropTarget && 'Soltar aqui para mover para a raiz'}
    </div>
  )
}
