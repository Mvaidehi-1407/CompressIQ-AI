import { motion } from 'framer-motion'

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-surface-900 z-50">
      <div className="bg-grid absolute inset-0 opacity-40" />
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.8) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              boxShadow: '0 0 60px rgba(37,99,235,0.6)',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L36 13V27L20 36L4 27V13L20 4Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <path d="M20 4V36M4 13L36 27M36 13L4 27" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" />
              <circle cx="20" cy="20" r="5" fill="white" />
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold gradient-text">CompressIQ AI</h1>
          <p className="text-slate-400 text-sm mt-1">Intelligent Storage Optimization</p>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 1.2, ease: 'easeInOut' }}
          className="w-48 h-1 rounded-full overflow-hidden bg-slate-800"
        >
          <div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
