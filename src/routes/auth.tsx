import { AuthForm } from '#/components/auth-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/auth')({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })}>
          Voltar para workspaces
        </Button>
      </div>

      <AuthForm />
    </div>
  )
}
