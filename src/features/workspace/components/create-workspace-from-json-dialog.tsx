import { useCallback, useState } from 'react'
import {
  Tooltip,
  TooltipTrigger,
  TooltipPanel
} from '@/components/animate-ui/components/base/tooltip'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '#/components/ui/dialog'
import { useWorkspace } from '@/features/workspace/hooks/use-workspace'
import { validateWorkspaceJson } from '#/lib/workspace-json'
import { ClipboardPaste, Copy, FileJson } from 'lucide-react'
import toast from 'react-hot-toast'
import { twMerge } from 'tailwind-merge'

const EXAMPLE_JSON = `{
  "name": "Meu Workspace",
  "folders": [
    {
      "name": "Documentação",
      "links": [
        { "title": "Doc", "url": "/doc" }
      ]
    },
    {
      "name": "Projetos",
      "links": [
        { "title": "Home", "url": "/" }
      ]
    }
  ],
  "links": [
    { "title": "Link na raiz", "url": "/root" }
  ]
}
`

export interface CreateWorkspaceFromJsonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceFromJsonDialog({
  open,
  onOpenChange
}: CreateWorkspaceFromJsonDialogProps) {
  const { createWorkspaceFromPayload, isSyncing } = useWorkspace()
  const [jsonInput, setJsonInput] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = useCallback(async () => {
    setValidationError(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonInput)
    } catch {
      setValidationError('JSON inválido.')
      return
    }

    const result = validateWorkspaceJson(parsed)
    if (!result.success) {
      setValidationError(result.error)
      return
    }

    setIsCreating(true)
    try {
      const id = await createWorkspaceFromPayload(result.data)
      if (id) {
        toast.success('Workspace criado com sucesso.')
        onOpenChange(false)
        setJsonInput('')
        setValidationError(null)
      } else {
        toast.error('Falha ao criar workspace. Faça login para criar.')
        setValidationError('Faça login para criar workspace.')
      }
    } catch {
      toast.error('Erro ao criar workspace.')
      setValidationError('Erro ao criar workspace.')
    } finally {
      setIsCreating(false)
    }
  }, [jsonInput, createWorkspaceFromPayload, onOpenChange])

  const handleCopy = useCallback(() => {
    if (!jsonInput || !navigator.clipboard?.writeText) return
    navigator.clipboard
      .writeText(jsonInput)
      .then(() => toast.success('Copiado.'))
      .catch(() => {})
  }, [jsonInput])

  const handlePaste = useCallback(async () => {
    if (!navigator.clipboard?.readText) {
      setValidationError('Use Ctrl+V para colar no campo.')
      return
    }
    try {
      const text = await navigator.clipboard.readText()
      setJsonInput(text)
      setValidationError(null)
    } catch {
      setValidationError('Use Ctrl+V para colar no campo.')
    }
  }, [])

  const handleUseTemplate = useCallback(() => {
    if (!navigator.clipboard?.writeText) {
      setJsonInput(EXAMPLE_JSON)
      setValidationError(null)
      toast.success('Template inserido. Edite do seu jeito ou use em uma IA.')
      return
    }
    navigator.clipboard
      .writeText(EXAMPLE_JSON)
      .then(() =>
        toast.success(
          'Template copiado. Cole no campo ou use em uma IA para editar.'
        )
      )
      .catch(() => {
        setJsonInput(EXAMPLE_JSON)
        setValidationError(null)
        toast.success('Template inserido. Edite do seu jeito ou use em uma IA.')
      })
  }, [])

  const isLoading = isSyncing || isCreating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col sm:max-w-lg"
        data-slot="create-workspace-from-json-dialog"
      >
        <DialogHeader>
          <DialogTitle>Importar workspace de JSON</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">
              Cole um JSON no formato do workspace (nome, pastas e links) para
              criar um novo workspace. Use o template ou edite com uma IA.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div
          className="overflow-hidden rounded-md border border-border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50"
          data-slot="json-code-block"
        >
          <div className="flex flex-row items-center justify-between gap-2 border-b border-border bg-muted/50 px-2 py-1">
            <span className="font-mono text-xs text-muted-foreground">
              workspace.json
            </span>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={handleUseTemplate}
                    aria-label="Copiar template"
                  >
                    <FileJson className="size-3.5" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipPanel>
                  Copiar template (edite ou use em uma IA)
                </TooltipPanel>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={handleCopy}
                    disabled={!jsonInput}
                    aria-label="Copiar"
                  >
                    <Copy className="size-3.5" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipPanel>Copiar</TooltipPanel>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={handlePaste}
                    aria-label="Colar"
                  >
                    <ClipboardPaste className="size-3.5" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipPanel>Colar</TooltipPanel>
              </Tooltip>
            </div>
          </div>
          <textarea
            aria-label="JSON do workspace"
            value={jsonInput}
            onChange={e => {
              setJsonInput(e.target.value)
              setValidationError(null)
            }}
            placeholder={EXAMPLE_JSON}
            className={twMerge(
              'min-h-[200px] w-full resize-y bg-background px-4 py-4 font-mono text-sm leading-relaxed outline-none',
              'placeholder:text-muted-foreground',
              'focus-visible:ring-0',
              'selection:bg-primary/20'
            )}
            spellCheck={false}
            data-state={validationError ? 'invalid' : undefined}
          />
        </div>

        {validationError && (
          <p className="text-sm text-destructive" role="alert">
            {validationError}
          </p>
        )}

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isLoading || !jsonInput.trim()}
          >
            {isLoading ? 'Importando…' : 'Importar workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
