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
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto w-full max-w-4xl px-6 lg:px-12 my-4">
          <Outlet />
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
