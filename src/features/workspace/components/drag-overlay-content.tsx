import { useDragOperation } from '@dnd-kit/react'
import { Folder, Globe } from 'lucide-react'
import type { DndItemData } from '../types'

export function DragOverlayContent() {
  const { source } = useDragOperation()
  if (!source) return null

  const itemData = source.data as DndItemData
  if (!itemData?.type) return null

  return (
    <div
      data-slot="drag-overlay-content"
      className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-lg"
    >
      {itemData.type === 'folder' ? (
        <Folder className="size-4 text-muted-foreground" />
      ) : (
        <Globe className="size-4 text-muted-foreground" />
      )}
      <span className="font-medium">{itemData.name}</span>
    </div>
  )
}
