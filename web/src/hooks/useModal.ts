import { useState, useCallback } from 'react'

/**
 * useModal - Centralized hook for managing modal/dropdown open/close state
 *
 * This hook standardizes the common pattern of:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * ```
 *
 * @param defaultOpen - Initial open state (default: false)
 * @returns Object with isOpen state and control functions
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useModal()
 *
 * return (
 *   <>
 *     <button onClick={open}>Open Modal</button>
 *     {isOpen && (
 *       <Modal onClose={close}>
 *         <button onClick={toggle}>Toggle</button>
 *       </Modal>
 *     )}
 *   </>
 * )
 * ```
 *
 * @example Multiple modals
 * ```tsx
 * const addCard = useModal()
 * const configure = useModal()
 * const templates = useModal()
 *
 * return (
 *   <>
 *     <button onClick={addCard.open}>Add Card</button>
 *     <button onClick={configure.open}>Configure</button>
 *     {addCard.isOpen && <AddCardModal onClose={addCard.close} />}
 *     {configure.isOpen && <ConfigModal onClose={configure.close} />}
 *   </>
 * )
 * ```
 */
export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  }
}

/**
 * Return type of useModal hook
 */
export type UseModalResult = ReturnType<typeof useModal>
