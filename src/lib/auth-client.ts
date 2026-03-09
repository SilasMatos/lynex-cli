import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: "https://lynex-api-production.up.railway.app",
  basePath: "/auth",
  fetchOptions: {
    credentials: "include",
  },
})

export const { signIn, signUp, signOut, useSession } = authClient