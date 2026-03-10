import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import contentCollections from '@content-collections/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  server: {
    proxy: {
      '/auth': 'http://localhost:3333',
      '/workspaces': 'http://localhost:3333',
    },
  },
  plugins: [
    devtools(),
    contentCollections(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
  ],
})

export default config
