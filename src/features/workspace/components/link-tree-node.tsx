import { useDraggable } from '@dnd-kit/react'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipPanel
} from '@/components/animate-ui/components/base/tooltip'
import {
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNode,
  TreeNodeTrigger
} from '#/components/kibo-ui/tree'
import { ExternalLink, Globe, Pencil, Trash2 } from 'lucide-react'
import { cn } from '#/lib/utils'
import { useWorkspacePage } from '../workspace-context'
import type { Link as LinkType, DndItemData } from '../types'

export interface LinkTreeNodeProps {
  link: LinkType
  level: number
  isLast?: boolean
}

export function LinkTreeNode({ link, level, isLast }: LinkTreeNodeProps) {
  const { deleteLink, openEditLinkDialog } = useWorkspacePage()

  const { ref: dragRef, isDragging } = useDraggable({
    id: `drag-link-${link.id}`,
    data: { type: 'link', id: link.id, name: link.title } satisfies DndItemData
  })

  return (
    <div
      ref={dragRef}
      data-slot="link-tree-node"
      className={cn(
        'rounded-md transition-all duration-200',
        isDragging && 'opacity-40'
      )}
    >
      <TreeNode nodeId={link.id} level={level} isLast={isLast}>
        <TreeNodeTrigger>
          <TreeExpander />
          <TreeIcon icon={<Globe className="size-4" />} />
          <TreeLabel>{link.title}</TreeLabel>

          <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  aria-label="Abrir link"
                  variant="outline"
                  size="icon"
                  onClick={e => {
                    e.stopPropagation()
                    window.open(link.url, '_blank', 'noopener,noreferrer')
                  }}
                >
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipPanel>Abrir Link</TooltipPanel>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Button
                  aria-label="Editar link"
                  onClick={e => {
                    e.stopPropagation()
                    openEditLinkDialog(link)
                  }}
                  variant="outline"
                  size="icon"
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipPanel>Editar</TooltipPanel>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Button
                  aria-label="Deletar link"
                  onClick={e => {
                    e.stopPropagation()
                    deleteLink(link.id)
                  }}
                  variant="outline"
                  size="icon"
                >
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipPanel>Deletar</TooltipPanel>
            </Tooltip>
          </div>
        </TreeNodeTrigger>
      </TreeNode>
    </div>
  )
}
