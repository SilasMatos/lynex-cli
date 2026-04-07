import type { ComponentProps } from 'react'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { twMerge } from 'tailwind-merge'
import { useWorkspacePage } from '../workspace-context'

export interface ShareButtonProps extends ComponentProps<typeof Button> {
  onAction?: () => void
}

export function ShareButton({
  onAction,
  className,
  onClick,
  ...props
}: ShareButtonProps) {
  const { workspaceId } = useWorkspacePage()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!workspaceId) return
    const url = `${window.location.origin}/w/${workspaceId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onAction?.()
  }

  if (!workspaceId) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={twMerge(className)}
      onClick={e => {
        onClick?.(e)
        handleCopy()
      }}
      {...props}
    >
      {copied ? (
        <>
          <Check className="size-4" />
          Copiado!
        </>
      ) : (
        <>
          <Link2 className="size-4" />
          Compartilhar
        </>
      )}
    </Button>
  )
}
