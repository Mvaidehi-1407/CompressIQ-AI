import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useFileStore } from '../store/fileStore'
import api from '../lib/api'
import { Upload, Zap, ShieldCheck, Copy, TrendingDown, ArrowRight, FileText, Image, Video, Archive } from 'lucide-react'

function fmt(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) return
    let start = 0
    const step = target / 40
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 30)
    return () => clearInterval(timer)
  }, [target])
  return <span>{val}{suffix}</span>
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { files, fetchFiles } = useFileStore()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchFiles()
    api.get('/api/analytics/overview').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const statCards = stats ? [
    { label: 'Total Files', value: stats.total_files, suffix: '', icon: FileText, color: 'from-blue-500 to-cyan-500', glow: 'rgba(37,99,235,0.3)' },
    { label: 'Space Saved', value: stats.total_saved_bytes, fmt: true, icon: TrendingDown, color: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.3)' },
    { label: 'Duplicates Found', value: stats.duplicate_files, suffix: '', icon: Copy, color: 'from-orange-500 to-amber-500', glow: 'rgba(249,115,22,0.3)' },
    { label: 'Restorable Files', value: stats.protected_files, suffix: '', icon: ShieldCheck, color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.3)' },
  ] : []

  const typeIcon: Record<string, any> = { image: Image, video: Video, document: FileText, archive: Archive }

  const quickActions = [
    { to: '/upload', icon: Upload, label: 'Upload Files', desc: 'Add new files to your vault', color: 'from-blue-500 to-cyan-500' },
    { to: '/compress', icon: Zap, label: 'Compress Files', desc: 'Optimize with AI recommendations', color: 'from-violet-500 to-purple-600' },
    { to: '/restore', icon: ShieldCheck, label: 'Restore Files', desc: 'Recover protected originals', color: 'from-emerald-500 to-teal-500' },
    { to: '/analytics', icon: TrendingDown, label: 'View Analytics', desc: 'Storage savings insights', color: 'from-orange-500 to-amber-500' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-slate-100">
          Welcome back, <span className="gradient-text">{user?.username}</span> ðŸ‘‹
        </h1>
        <p className="text-slate-400 mt-1">Your storage intelligence dashboard â€” all systems operational.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats ? statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`} style={{ boxShadow: `0 0 20px ${s.glow}` }}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {s.fmt ? fmt(s.value) : <AnimatedCounter target={s.value} suffix={s.suffix} />}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">{s.label}</div>
          </motion.div>
        )) : Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card shimmer-bg h-28 rounded-2xl" />
        ))}
      </div>

      {/* Storage Overview */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
          <h2 className="text-base font-bold text-slate-200 mb-5">Storage Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Original Size', val: fmt(stats.total_original_bytes), color: '#60a5fa' },
              { label: 'Compressed Size', val: fmt(stats.total_compressed_bytes), color: '#34d399' },
              { label: 'Duplicate Space', val: fmt(stats.duplicate_space_bytes), color: '#fb923c' },
              { label: 'Avg. Compression', val: `${stats.avg_compression_ratio}%`, color: '#a78bfa' },
            ].map(item => (
              <div key={item.label}>
                <div className="text-xl font-black" style={{ color: item.color }}>{item.val}</div>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
          {stats.total_original_bytes > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Compression Coverage</span>
                <span>{stats.compressed_files} / {stats.unique_files} files</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.unique_files ? (stats.compressed_files / stats.unique_files) * 100 : 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="section-header mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a, i) => (
            <motion.div key={a.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.07 }}>
              <Link to={a.to} className="card glass-hover flex flex-col gap-3 h-full">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center`}>
                  <a.icon size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100 text-sm">{a.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
                </div>
                <ArrowRight size={14} className="text-slate-600 mt-auto self-end" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Files */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header">Recent Files</h2>
          <Link to="/upload" className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card p-0 overflow-hidden">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Upload size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-500 font-medium">No files yet</p>
              <p className="text-slate-600 text-sm mb-4">Upload your first file to get started</p>
              <Link to="/upload" className="btn-primary text-sm py-2 px-5">Upload Files</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['File', 'Type', 'Size', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.slice(0, 8).map((f, i) => {
                  const Icon = typeIcon[f.file_type] ?? FileText
                  return (
                    <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0">
                            <Icon size={15} className="text-blue-400" />
                          </div>
                          <span className="text-slate-200 font-medium truncate max-w-[180px]">{f.original_filename}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 capitalize">{f.file_type}</td>
                      <td className="px-5 py-3.5 text-slate-400">{fmt(f.original_size)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {f.is_duplicate && <span className="badge-orange">Duplicate</span>}
                          {f.is_compressed && <span className="badge-cyan">Compressed</span>}
                          {f.is_protected && <span className="badge-violet">Protected</span>}
                          {!f.is_duplicate && !f.is_compressed && !f.is_protected && <span className="badge-green">Ready</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {f.is_compressed && (
                          <span className="text-emerald-400 text-xs font-bold">-{f.compression_ratio.toFixed(1)}%</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
