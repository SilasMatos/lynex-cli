import Logo from '#/components/logo'
import { Button } from '#/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { signOut, useSession } from '#/lib/auth-client'
import { LogOut } from 'lucide-react'

export function Navbar() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/auth' })
  }

  return (
    <header className="border-b border-white/5 bg-transparent px-4 md:px-6">
      <div className="flex h-16 justify-between gap-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-6">
            <a
              className="flex items-center gap-2 text-white hover:text-white/90 transition-colors"
              href="/"
            >
              <Logo />
              <span className="font-semibold text-base tracking-tight">
                lynex
              </span>
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="text-sm text-white/40 hidden sm:block">
                {session.user.name || session.user.email}
              </span>
              <Button
                className="text-sm text-white/60 hover:text-white hover:bg-white/5"
                size="sm"
                variant="ghost"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                className="text-sm text-white/60 hover:text-white hover:bg-white/5"
                size="sm"
                variant="ghost"
              >
                <a href="/auth">Sign In</a>
              </Button>
              <Button
                asChild
                className="text-sm bg-white text-black hover:bg-white/90"
                size="sm"
              >
                <a href="/auth">Get Started</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
