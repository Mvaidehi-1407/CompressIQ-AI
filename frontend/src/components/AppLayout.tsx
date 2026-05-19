import Sidebar from './Sidebar'
import { motion } from 'framer-motion'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-900">
      <div className="bg-grid absolute inset-0 opacity-30 pointer-events-none" />
      <Sidebar />
      <motion.main
        className="flex-1 overflow-auto relative"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
