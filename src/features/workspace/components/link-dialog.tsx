import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useWorkspacePage } from '../workspace-context'
import type { LinkDialogState } from '../types'

export interface LinkDialogProps {
  state: LinkDialogState
  onClose: () => void
}

export function LinkDialog({ state, onClose }: LinkDialogProps) {
  const { addLink, updateLink } = useWorkspacePage()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!state.open) return
    if (state.mode === 'edit') {
      setTitle(state.link.title)
      setUrl(state.link.url)
    } else {
      setTitle('')
      setUrl('')
    }
  }, [state])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return

    if (state.open && state.mode === 'add') {
      addLink(title.trim(), url.trim(), state.folderId ?? undefined)
    } else if (state.open && state.mode === 'edit') {
      updateLink(state.link.id, {
        title: title.trim(),
        url: url.trim()
      })
    }
    onClose()
  }

  return (
    <Dialog open={state.open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state.open && state.mode === 'edit' ? 'Editar Link' : 'Novo Link'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor="link-title">Título</Label>
          <Input
            id="link-title"
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <Label htmlFor="link-url">URL</Label>
          <Input
            id="link-url"
            placeholder="https://…"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          \
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              {state.open && state.mode === 'edit' ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
