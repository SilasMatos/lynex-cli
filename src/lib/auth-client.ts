import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'https://lynex-api-production.up.railway.app',
  basePath: '/auth',
})

export const { signIn, signUp, signOut, useSession } = authClient
