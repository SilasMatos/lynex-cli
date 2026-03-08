import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'lynex-api-production.up.railway.app',
})

export const { signIn, signUp, signOut, useSession } = authClient
