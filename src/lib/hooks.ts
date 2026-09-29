import { useEffect, useRef, useState } from 'react'

const desktopQuery = '(min-width: 900px)'

export function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(desktopQuery).matches)
  useEffect(() => {
    const mq = window.matchMedia(desktopQuery)
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

/** Re-render periodically so relative times ("۵ دقیقه پیش") stay fresh. */
export function useTick(ms = 30_000) {
  const [, set] = useState(0)
  useEffect(() => {
    const t = setInterval(() => set((n) => n + 1), ms)
    return () => clearInterval(t)
  }, [ms])
}

export const isTouch = () => window.matchMedia('(pointer: coarse)').matches

/**
 * Right-click on desktop, long-press on touch. Returns handlers to spread on
 * the element; `fired()` tells a click handler to ignore the click that ends a
 * long press.
 */
export function useContextPress(onOpen: (x: number, y: number) => void) {
  const r = useRef<{ timer?: ReturnType<typeof setTimeout>; start?: { x: number; y: number }; fired: boolean }>({ fired: false })
  const openRef = useRef(onOpen)
  openRef.current = onOpen
  const clear = () => {
    clearTimeout(r.current.timer)
    r.current.timer = undefined
    r.current.start = undefined
  }
  return {
    handlers: {
      onContextMenu(e: React.MouseEvent) {
        e.preventDefault()
        if (!r.current.fired) openRef.current(e.clientX, e.clientY)
      },
      onPointerDown(e: React.PointerEvent) {
        r.current.fired = false
        if (e.pointerType !== 'touch') return
        r.current.start = { x: e.clientX, y: e.clientY }
        const { clientX, clientY } = e
        r.current.timer = setTimeout(() => {
          r.current.fired = true
          navigator.vibrate?.(12)
          openRef.current(clientX, clientY)
        }, 430)
      },
      onPointerMove(e: React.PointerEvent) {
        const s = r.current.start
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) clear()
      },
      onPointerUp: clear,
      onPointerCancel: clear,
    },
    fired: () => r.current.fired,
  }
}
