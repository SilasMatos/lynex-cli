import { AuthForm } from '#/components/auth-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <AuthForm />
    </div>
  )
}
