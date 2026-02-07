import { useState, useCallback } from 'react'

/**
 * Standard hook for managing modal open/close state
 * 
 * Centralizes the common pattern of:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * ```
 * 
 * @param initialOpen - Initial open state (default: false)
 * @returns Object with isOpen state and control functions
 * 
 * @example
 * ```tsx
 * const modal = useModal()
 * // or with custom initial state
 * const modal = useModal(true)
 * 
 * return (
 *   <>
 *     <button onClick={modal.open}>Open</button>
 *     <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *       ...
 *     </Modal>
 *   </>
 * )
 * ```
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  }
}

/**
 * Hook for managing multiple related modals with a single state machine
 * 
 * @param modalNames - Array of modal identifiers
 * @returns Object with openModal, closeModal, and isModalOpen functions
 * 
 * @example
 * ```tsx
 * const modals = useModals(['add', 'edit', 'delete'])
 * 
 * return (
 *   <>
 *     <button onClick={() => modals.openModal('add')}>Add</button>
 *     <Modal isOpen={modals.isModalOpen('add')} onClose={modals.closeModal}>
 *       ...
 *     </Modal>
 *   </>
 * )
 * ```
 */
export function useModals<T extends string>(_modalNames: T[]) {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set())

  const openModal = useCallback((name: T) => {
    setOpenModals(prev => new Set(prev).add(name))
  }, [])

  const closeModal = useCallback((name?: T) => {
    if (name) {
      setOpenModals(prev => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
    } else {
      // Close all modals
      setOpenModals(new Set())
    }
  }, [])

  const isModalOpen = useCallback((name: T) => {
    return openModals.has(name)
  }, [openModals])

  const toggleModal = useCallback((name: T) => {
    setOpenModals(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }, [])

  return {
    openModal,
    closeModal,
    isModalOpen,
    toggleModal,
  }
}
