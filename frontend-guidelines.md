---

## Stack

- **React 19** (sem `forwardRef`)
- **TypeScript** strict
- **Tailwind CSS v4** com `@theme` e CSS variables
- **Base UI React** (`@base-ui/react`) para componentes headless
- **Tailwind Variants** (`tailwind-variants`) para variantes
- **Tailwind Merge** (`tailwind-merge`) para merge de classes
- **Phosphor Icons**(como principal) ou **Lucide React** para ícones
- **shadcn/ui**
- **react-hot-toast** para alertas

---

## Nomenclatura

- Arquivos: **lowercase com hífens** → `user-card.tsx`, `use-modal.ts`
- **Sempre named exports**, nunca default export
- Não criar barrel files (`index.ts`) para pastas internas

---

## Estrutura de Componente

```tsx
import { tv, type VariantProps } from 'tailwind-variants'
import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export const buttonVariants = tv({
  base: [
    'inline-flex cursor-pointer items-center justify-center font-medium rounded-lg border transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
  ],
  variants: {
    variant: {
      primary:
        'border-primary bg-primary text-primary-foreground hover:bg-primary-hover',
      secondary:
        'border-border bg-secondary text-secondary-foreground hover:bg-muted',
      ghost:
        'border-transparent bg-transparent text-muted-foreground hover:text-foreground',
      destructive:
        'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90'
    },
    size: {
      sm: 'h-6 px-2 gap-1.5 text-xs [&_svg]:size-3',
      md: 'h-7 px-3 gap-2 text-sm [&_svg]:size-3.5',
      lg: 'h-9 px-4 gap-2.5 text-base [&_svg]:size-4'
    }
  },
  defaultVariants: { variant: 'primary', size: 'md' }
})

export interface ButtonProps
  extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      data-slot="button"
      data-disabled={disabled ? '' : undefined}
      className={twMerge(buttonVariants({ variant, size }), className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## Compound Components

```tsx
import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export interface CardProps extends ComponentProps<'div'> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={twMerge(
        'bg-surface flex flex-col gap-6 rounded-xl border border-border p-6 shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={twMerge('flex flex-col gap-1.5', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={twMerge('text-lg font-semibold', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={className} {...props} />
}
```

---

## Cores (CSS Variables)

utilize inicialmente todas as cores que ja estao definidas em styles.css

```
bg-surface, bg-surface-raised       → fundos
bg-primary, bg-secondary, bg-muted  → ações/estados
bg-destructive                      → erros/danger

text-foreground                     → texto principal
text-foreground-subtle              → texto secundário
text-muted-foreground               → texto desabilitado
text-primary-foreground             → texto em bg primary

border-border, border-input         → bordas padrão
border-primary, border-destructive  → bordas de destaque

ring-ring                           → focus ring
```

---

## TypeScript

```tsx
// ✅ Estender ComponentProps + VariantProps
export interface ButtonProps
  extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {}

// ✅ Import type para tipos
import type { ComponentProps } from 'react'
import type { VariantProps } from 'tailwind-variants'

// ❌ Não usar React.FC nem any
```

---

## Padrões Importantes

```tsx
// Sempre usar twMerge
className={twMerge('classes-base', className)}

// Sempre usar data-slot
<div data-slot="card">

// Estados com data-attributes
data-disabled={disabled ? '' : undefined}
className="data-[disabled]:opacity-50 data-[selected]:bg-primary"

// Focus visible
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Ícones com tamanho
<Check className="size-4" />
'[&_svg]:size-3.5' // em variantes

// Botões de ícone precisam de aria-label
<button aria-label="Fechar"><X className="size-4" /></button>

// Props spread no final
{...props}
```

---

## Base UI (utilze os ja criados pelo shadcn nao precisa declarar um novo component )

---

## para badges e outros components ui utilize os estiliazados do shadcn

## evite comentarios desnecessarios

## Checklist

- [ ] Arquivo lowercase com hífens
- [ ] Named export
- [ ] `ComponentProps<'elemento'>` + `VariantProps`
- [ ] Variantes com `tv()`, classes com `twMerge()`
- [ ] `data-slot` para identificação
- [ ] Estados via `data-[state]:`
- [ ] Cores do tema (não hardcoded)
- [ ] Focus visible em interativos
- [ ] `aria-label` em botões de ícone
- [ ] `{...props}` no final

---

## Error Handling Pattern

<!-- Definir padrão evita código inconsistente. -->

Exemplo:

lib/errors.ts

```tsx
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
```

## Loading States (React Query + Skeleton)

Para estados de carregamento utilize **Skeleton do shadcn/ui** ao invés de spinners sempre que possível.

Skeleton melhora a percepção de performance e mantém o layout estável enquanto os dados carregam.

---

### Quando usar Skeleton

Use Skeleton quando:

- dados de UI ainda estão carregando
- layout do componente já é conhecido
- listas ou cards estão sendo carregados

Evite spinner quando o conteúdo tem layout previsível.

---

### Exemplo com React Query

```tsx
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

export function UserCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getUser
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <img src={data.avatar} alt={data.name} className="size-10 rounded-full" />
      <div>
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">{data.email}</p>
      </div>
    </div>
  )
}
```

Sempre que possível criar um componente `ComponentNameSkeleton`.
