import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsDesktop } from '../lib/hooks'

interface Props {
  title?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}

/** Bottom sheet on mobile (drag the header down to close), centered dialog on desktop. Wrap in <AnimatePresence>. */
export function Sheet({ title, onClose, children, actions }: Props) {
  const desktop = useIsDesktop()
  const drag = useDragControls()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const motionProps = desktop
    ? { initial: { opacity: 0, scale: 0.94 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }

  return createPortal(
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="sheet"
        role="dialog"
        {...motionProps}
        transition={{ type: 'spring', stiffness: 460, damping: 40 }}
        drag={desktop ? false : 'y'}
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose()
        }}
      >
        <div onPointerDown={(e) => !desktop && drag.start(e)} style={{ touchAction: 'none' }}>
          <div className="grabber" />
          <div className="sheet-head">
            <button className="icon-btn" onClick={onClose} aria-label="بستن">
              <X size={22} />
            </button>
            <h3>{title}</h3>
            {actions}
          </div>
        </div>
        <div className="scroll" style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </motion.div>
    </>,
    document.body,
  )
}
