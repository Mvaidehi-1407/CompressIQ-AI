import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import ProfileModal from './ProfileModal'
import {
  LayoutDashboard, Upload, Zap, ShieldCheck,
  BarChart3, LogOut, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload',    icon: Upload,          label: 'Upload Center' },
  { to: '/compress',  icon: Zap,             label: 'Compression' },
  { to: '/restore',   icon: ShieldCheck,     label: 'Restoration Vault' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col glass-dark border-r border-white/5">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M20 4L36 13V27L20 36L4 27V13L20 4Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="20" cy="20" r="5" fill="white" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-sm gradient-text">CompressIQ</span>
            <span className="block text-[10px] text-slate-500 font-medium">AI Platform</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-blue-400' : ''} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-blue-400 opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <button onClick={() => setProfileOpen(true)} className="glass rounded-xl p-3 mb-3 w-full text-left transition-all hover:border-blue-500/30 hover:bg-white/[0.06]" title="Open profile">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
            >
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </button>
        <button
          onClick={handleLogout}
          className="w-full sidebar-link text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </aside>
  )
}
