import { useEffect, useRef, useState } from 'react'
import { Folder } from 'lucide-react'

export interface InlineFolderInputProps {
  level: number
  defaultValue?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

export function InlineFolderInput({
  level,
  defaultValue = '',
  onSubmit,
  onCancel
}: InlineFolderInputProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      if (defaultValue) inputRef.current?.select()
    })
  }, [defaultValue])

  const handleSubmit = () => {
    const name = value.trim()
    if (name) onSubmit(name)
    else onCancel()
  }

  return (
    <div
      data-slot="inline-folder-input"
      className="mx-1 flex items-center rounded-md px-3 py-2"
      style={{ paddingLeft: level * 20 + 8 }}
    >
      <div className="mr-1 size-4" />
      <div className="mr-2 flex size-4 items-center justify-center text-muted-foreground">
        <Folder className="size-4" />
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={handleSubmit}
        className="flex-1 border-b border-primary/30 bg-transparent py-0.5 text-sm outline-none"
        placeholder="Folder name…"
      />
    </div>
  )
}
