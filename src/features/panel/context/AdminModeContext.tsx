/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'

interface AdminModeContextValue {
  isAdmin: boolean
}

const AdminModeContext = createContext<AdminModeContextValue>({ isAdmin: false })

export const AdminModeProvider = ({
  isAdmin,
  children,
}: {
  isAdmin: boolean
  children: ReactNode
}) => (
  <AdminModeContext.Provider value={{ isAdmin }}>
    {children}
  </AdminModeContext.Provider>
)

export const useAdminMode = (): AdminModeContextValue => useContext(AdminModeContext)
