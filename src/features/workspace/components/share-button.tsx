import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { useWorkspacePage } from '../workspace-context'

export function ShareButton() {
  const { workspaceId } = useWorkspacePage()
  const [copied, setCopied] = useState(false)

  if (!workspaceId) return null

  const handleCopy = async () => {
    const url = `${window.location.origin}/w/${workspaceId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
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
