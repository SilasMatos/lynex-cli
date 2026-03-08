import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import '../styles.css'
import { Navbar } from '#/components/navbar'

export const Route = createRootRoute({
  component: RootComponent
})

function RootComponent() {
  const pathname = useRouterState({ select: s => s.location.pathname })
  const isAuth = pathname === '/auth'

  return (
    <>
      <div className="min-h-screen w-full bg-black relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top, rgba(255,255,255,0.06) 0%, rgba(255, 255, 255, 0.071) 20%, rgba(0,0,0,0) 60%)'
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.049) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.041) 1px, transparent 1px)',
            backgroundSize: '80px 80px'
          }}
        />
        <div className="relative z-10">
          {!isAuth && <Navbar />}
          <div className="mx-auto w-full max-w-4xl px-6 lg:px-12 my-4 mt-10">
            <Outlet />
          </div>
        </div>
      </div>
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[
          { name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }
        ]}
      />
    </>
  )
}
