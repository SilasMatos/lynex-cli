import Logo from '#/components/logo'
import { Button } from '#/components/ui/button'
import { Link, useNavigate } from '@tanstack/react-router'
import { signOut, useSession } from '#/lib/auth-client'
import { LogOut } from 'lucide-react'
import { Separator } from './ui/separator'

export function Navbar() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut()
    navigate({ to: '/auth' })
  }

  return (
    <header className="  bg-transparent px-4 md:px-6 container mx-auto ">
      <div className="flex h-16 justify-between gap-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-6">
            <Link
              className="flex items-center gap-2 text-white hover:text-white/90 transition-colors"
              to="/"
            >
              <Logo />
              <span className="font-semibold text-base tracking-tight">
                lynex
              </span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="text-sm text-white/40 hidden sm:block">
                {session.user.name || session.user.email}
              </span>
              <Separator orientation="vertical" className="" />
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
                <Link to="/auth">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
