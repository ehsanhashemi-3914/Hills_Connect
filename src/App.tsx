import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { HillsMark } from './components/Brand'
import { Auth } from './screens/Auth'
import { Onboarding } from './screens/Onboarding'
import { Shell } from './screens/Shell'

export function App() {
  const phase = useStore((s) => s.phase)
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0616' : '#ffffff')
  }, [theme])

  useEffect(() => useStore.getState().boot(), [])

  return (
    <AnimatePresence mode="wait">
      {phase === 'splash' && <Splash key="splash" />}
      {phase === 'auth' && (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Auth />
        </motion.div>
      )}
      {phase === 'onboarding' && (
        <motion.div key="onb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Onboarding />
        </motion.div>
      )}
      {phase === 'ready' && (
        <motion.div key="main" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <Shell />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Splash() {
  return (
    <motion.div className="stage" exit={{ opacity: 0, transition: { duration: 0.35 } }}>
      <div className="grid-lines" />
      <div className="splash-mark">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 16 }}>
          <HillsMark size={84} animate />
        </motion.div>
        <motion.div className="splash-word" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
          HILLS
          <small>CONNECT</small>
        </motion.div>
      </div>
    </motion.div>
  )
}
