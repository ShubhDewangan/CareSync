// context/UserContext.tsx
"use client"

import { createContext, useContext, useState } from "react"
import { Patient, Doctor } from "@/types/appwrite"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  $id: string
  name: string
  userType: "patient" | "doctor"
  email: string
  phone: string
}

export type FullUser =
  | (Patient & { userType: "patient" })
  | (Doctor & { userType: "doctor" })
  | null

interface UserContextValue {
  authUser: AuthUser | null          // from JWT — always available fast
  fullUser: FullUser                 // from DB — loaded after
  setAuthUser: (u: AuthUser | null) => void
  setFullUser: (u: FullUser) => void
  isLoading: boolean
  setIsLoading: (v: boolean) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextValue>({
  authUser: null,
  fullUser: null,
  setAuthUser: () => {},
  setFullUser: () => {},
  isLoading: true,
  setIsLoading: () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({
  children,
  initialAuthUser,
  initialFullUser,
}: {
  children: React.ReactNode
  initialAuthUser: AuthUser | null
  initialFullUser: FullUser
}) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialAuthUser)
  const [fullUser, setFullUser] = useState<FullUser>(initialFullUser)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <UserContext.Provider value={{
      authUser,
      fullUser,
      setAuthUser,
      setFullUser,
      isLoading,
      setIsLoading,
    }}>
      {children}
    </UserContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUser() {
  return useContext(UserContext)
}