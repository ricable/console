import { createContext, useContext } from 'react'

/**
 * Context to expose card expanded state to children
 */
interface CardExpandedContextType {
  isExpanded: boolean
}

export const CardExpandedContext = createContext<CardExpandedContextType>({ isExpanded: false })

/**
 * Hook for child components to know if their parent card is expanded
 */
export function useCardExpanded() {
  return useContext(CardExpandedContext)
}
