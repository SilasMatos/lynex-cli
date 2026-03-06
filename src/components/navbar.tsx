import Logo from '#/components/logo'
import { Button } from '#/components/ui/button'

export function Navbar() {
  return (
    <header className="border-b border-white/5 bg-trasparent px-4 md:px-6">
      <div className="flex h-16 justify-between gap-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-6">
            <a
              className="flex items-center gap-2 text-white hover:text-white/90 transition-colors"
              href="#"
            >
              <Logo />
              <span className="font-semibold text-base tracking-tight">
                lynex
              </span>
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="text-sm text-white/60 hover:text-white hover:bg-white/5"
            size="sm"
            variant="ghost"
          >
            <a href="#">Sign In</a>
          </Button>
          <Button
            asChild
            className="text-sm bg-white text-black hover:bg-white/90"
            size="sm"
          >
            <a href="#">Get Started</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
