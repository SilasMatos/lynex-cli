import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '#/features/workspace/page'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    folder: (search.folder as string | undefined) ?? undefined,
    link: (search.link as string | undefined) ?? undefined
  }),
  component: WorkspacePage
})
