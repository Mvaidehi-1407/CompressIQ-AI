import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { useFileStore } from '../store/fileStore'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingDown, Files, ShieldCheck, Copy, Zap } from 'lucide-react'

function fmt(b: number) {
  if (!b) return '0 B'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return `${(b/k**i).toFixed(1)} ${s[i]}`
}

const COLORS = { image:'#22d3ee', video:'#a78bfa', document:'#60a5fa', archive:'#fb923c' }
const PIE_COLORS = ['#2563eb','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-dark rounded-xl px-4 py-3 border border-white/10 text-xs">
      {label && <div className="text-slate-400 mb-1.5 font-semibold">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const { files, fetchFiles } = useFileStore()

  useEffect(() => {
    fetchFiles()
    api.get('/api/analytics/overview').then(r => setStats(r.data)).catch(() => {})
    api.get('/api/analytics/timeline').then(r => setTimeline(r.data.timeline ?? [])).catch(() => {})
  }, [])

  const typeBreakdown = stats ? Object.entries(stats.type_breakdown ?? {}).map(([type, data]: any) => ({
    name: type.charAt(0).toUpperCase()+type.slice(1),
    files: data.count,
    original: data.total_size,
    compressed: data.compressed_size || 0,
  })) : []

  const modeData = stats ? [
    { name: 'Lossless Vault', value: stats.mode_breakdown?.lossless ?? 0, color:'#22d3ee' },
    { name: 'Smart Shrink', value: stats.mode_breakdown?.smart_shrink ?? 0, color:'#a78bfa' },
  ] : []

  const statusData = stats ? [
    { name:'Compressed', value: stats.compressed_files, color:'#22d3ee' },
    { name:'Protected', value: stats.protected_files, color:'#a78bfa' },
    { name:'Duplicates', value: stats.duplicate_files, color:'#fb923c' },
    { name:'Unique', value: stats.unique_files - stats.compressed_files, color:'#60a5fa' },
  ].filter(d => d.value > 0) : []

  const summaryCards = stats ? [
    { label:'Total Saved', val: fmt(stats.total_saved_bytes), icon: TrendingDown, color:'from-emerald-500 to-teal-500', glow:'rgba(16,185,129,0.3)' },
    { label:'Files Processed', val: stats.unique_files, icon: Files, color:'from-blue-500 to-cyan-500', glow:'rgba(37,99,235,0.3)' },
    { label:'Avg. Reduction', val: `${stats.avg_compression_ratio}%`, icon: Zap, color:'from-violet-500 to-purple-600', glow:'rgba(139,92,246,0.3)' },
    { label:'Protected Files', val: stats.protected_files, icon: ShieldCheck, color:'from-emerald-500 to-green-600', glow:'rgba(16,185,129,0.3)' },
    { label:'Duplicates', val: stats.duplicate_files, icon: Copy, color:'from-orange-500 to-amber-500', glow:'rgba(249,115,22,0.3)' },
    { label:'Duplicate Space', val: fmt(stats.duplicate_space_bytes), icon: Copy, color:'from-red-500 to-rose-600', glow:'rgba(239,68,68,0.3)' },
  ] : []

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-3xl font-black text-slate-100">Analytics</h1>
        <p className="text-slate-400 mt-1">Live insights into your storage optimization performance.</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats ? summaryCards.map((c,i) => (
          <motion.div key={c.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }} className="stat-card">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`} style={{ boxShadow:`0 0 16px ${c.glow}` }}>
              <c.icon size={15} className="text-white"/>
            </div>
            <div className="text-lg font-black text-slate-100">{c.val}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider leading-tight">{c.label}</div>
          </motion.div>
        )) : Array.from({length:6}).map((_,i)=><div key={i} className="stat-card shimmer-bg h-24 rounded-2xl"/>)}
      </div>

      {/* Upload Timeline */}
      {timeline.length > 0 && (
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="card">
          <h2 className="text-base font-bold text-slate-200 mb-6">Upload & Savings Timeline</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeline} margin={{ top:5, right:10, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="gSize" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmt} tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} width={60}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:'12px', color:'#94a3b8' }}/>
              <Area type="monotone" dataKey="size" name="Uploaded" stroke="#2563eb" fill="url(#gSize)" strokeWidth={2}/>
              <Area type="monotone" dataKey="savings" name="Saved" stroke="#10b981" fill="url(#gSavings)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Type Breakdown Bar */}
        {typeBreakdown.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }} className="card">
            <h2 className="text-base font-bold text-slate-200 mb-6">Storage by File Type</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeBreakdown} margin={{ top:0, right:10, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={v=>fmt(v)} tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} width={55}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="original" name="Original" fill="#2563eb" radius={[4,4,0,0]} opacity={0.8}/>
                <Bar dataKey="compressed" name="Compressed" fill="#10b981" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Status Pie */}
        {statusData.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }} className="card">
            <h2 className="text-base font-bold text-slate-200 mb-6">File Status Distribution</h2>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {statusData.map((entry,i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent"/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-shrink-0">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:d.color }}/>
                    <span className="text-slate-400">{d.name}</span>
                    <span className="font-bold text-slate-200 ml-auto pl-3">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Compression Mode Breakdown */}
      {modeData.some(d => d.value > 0) && (
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }} className="card">
          <h2 className="text-base font-bold text-slate-200 mb-5">Compression Mode Usage</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {modeData.map(m => (
              <div key={m.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold" style={{ color:m.color }}>{m.name}</span>
                  <span className="text-slate-400 font-bold">{m.value} files</span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill" style={{ background:m.color }}
                    initial={{ width:0 }}
                    animate={{ width:`${stats?.compressed_files ? (m.value/stats.compressed_files)*100 : 0}%` }}
                    transition={{ duration:1, delay:0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {!stats && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card flex flex-col items-center py-20 text-center">
          <TrendingDown size={48} className="text-slate-700 mb-4"/>
          <p className="text-slate-500 font-medium text-lg">No analytics yet</p>
          <p className="text-slate-600 text-sm">Upload and compress files to see your storage insights here.</p>
        </motion.div>
      )}
    </div>
  )
}
