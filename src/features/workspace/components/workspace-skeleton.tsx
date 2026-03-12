import { Skeleton } from '#/components/ui/skeleton'

export function WorkspaceSkeleton() {
  return (
    <div data-slot="workspace-skeleton" className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <Skeleton className="size-4 rounded" />
          <Skeleton
            className="h-4 rounded"
            style={{ width: `${60 + i * 20}px` }}
          />
        </div>
      ))}
    </div>
  )
}
