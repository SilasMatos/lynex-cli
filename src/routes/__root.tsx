import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import '../styles.css'
import { Navbar } from '#/components/navbar'

export const Route = createRootRoute({
  component: RootComponent
})

function RootComponent() {
  return (
    <>
      <div className="min-h-screen w-full bg-black relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at top, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.04) 20%, rgba(0,0,0,0) 60%)'
          }}
        />

        <div className="relative z-10 min-h-screen flex flex-col">
          <Navbar />

          <main className="flex-1 flex justify-center pt-16">
            <div className="mx-auto w-full max-w-4xl px-6 lg:px-12 my-4">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <TanStackDevtools
        config={{
          position: 'bottom-right'
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />
          }
        ]}
      />
    </>
  )
}
