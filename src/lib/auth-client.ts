import { createAuthClient } from 'better-auth/react'
import { oAuthProxyClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: 'https://lynex-api-production.up.railway.app',
  basePath: '/auth',
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [oAuthProxyClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
