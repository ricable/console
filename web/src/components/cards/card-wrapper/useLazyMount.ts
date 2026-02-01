import { useState, useEffect, useRef } from 'react'

/**
 * Stagger mount delays across cards to prevent rendering all at once
 */
let mountIndex = 0
const MOUNT_DELAY_BASE = 16 // ~1 frame at 60fps
const MOUNT_DELAY_INCREMENT = 8 // stagger by half frame increments

/**
 * Eager mounting: progressively mount off-screen cards after visible ones settle.
 * Uses debounce so late-arriving cards are included, and per-callback IDs for
 * proper cancellation when a card unmounts or IntersectionObserver fires first.
 */
const EAGER_MOUNT_INITIAL_DELAY_MS = 2000 // wait for visible cards to render first
const EAGER_MOUNT_STAGGER_MS = 100 // stagger off-screen card mounts by 100ms each

let eagerMountTimer: ReturnType<typeof setTimeout> | null = null
let eagerMountCallbacks: Array<{ fn: () => void; id: number }> = []
let nextEagerId = 0

function scheduleEagerMount(mount: () => void): number {
  const id = nextEagerId++
  eagerMountCallbacks.push({ fn: mount, id })

  // Debounce: restart drain timer on each new registration.
  // This ensures we wait for ALL cards on the current page to register.
  if (eagerMountTimer !== null) {
    clearTimeout(eagerMountTimer)
  }
  eagerMountTimer = setTimeout(() => {
    const callbacks = [...eagerMountCallbacks]
    eagerMountCallbacks = []
    eagerMountTimer = null
    callbacks.forEach(({ fn }, i) => {
      setTimeout(fn, i * EAGER_MOUNT_STAGGER_MS)
    })
  }, EAGER_MOUNT_INITIAL_DELAY_MS)

  return id
}

function cancelEagerMount(id: number) {
  eagerMountCallbacks = eagerMountCallbacks.filter(cb => cb.id !== id)
}

/**
 * Hook for lazy mounting - only renders content when visible in viewport.
 * This prevents mounting 100+ cards at once when adding many cards.
 * Also staggers the rendering of visible cards to spread work across frames.
 *
 * Eager mounting: after visible cards settle (~2s), off-screen cards
 * progressively mount in the background so data is ready when scrolled to.
 */
export function useLazyMount(rootMargin = '100px') {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // Track which mount batch this card is in
  const mountOrderRef = useRef<number>(-1)
  const eagerIdRef = useRef<number>(-1)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // If already visible, no need to observe
    if (isVisible) return

    // Assign mount order on first effect
    if (mountOrderRef.current === -1) {
      mountOrderRef.current = mountIndex++
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the visibility change to spread work across frames
          const delay = MOUNT_DELAY_BASE + (mountOrderRef.current % 20) * MOUNT_DELAY_INCREMENT
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
          // Stop observing immediately - we don't unmount on scroll away
          observer.disconnect()
          // Cancel eager mount if scheduled
          if (eagerIdRef.current !== -1) {
            cancelEagerMount(eagerIdRef.current)
            eagerIdRef.current = -1
          }
        }
      },
      { rootMargin }
    )

    observer.observe(element)

    // Schedule eager mount for off-screen cards
    eagerIdRef.current = scheduleEagerMount(() => {
      setIsVisible(true)
      eagerIdRef.current = -1
    })

    return () => {
      observer.disconnect()
      if (eagerIdRef.current !== -1) {
        cancelEagerMount(eagerIdRef.current)
        eagerIdRef.current = -1
      }
    }
  }, [isVisible, rootMargin])

  return { ref, isVisible }
}
