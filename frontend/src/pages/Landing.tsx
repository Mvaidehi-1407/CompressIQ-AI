import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ShieldCheck, Copy, BarChart3, ArrowRight, Upload, Lock, TrendingDown, CheckCircle } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' } }),
}

const features = [
  { icon: Zap, title: 'AI Compression Engine', desc: 'Dual-mode compression — Lossless Vault for precision, Smart Shrink for maximum reduction. Real algorithms, real savings.', color: 'from-blue-500 to-cyan-500', glow: 'rgba(6,182,212,0.3)' },
  { icon: Copy, title: 'Duplicate Detection', desc: 'SHA-256 fingerprinting instantly detects duplicate files and quarantines them before wasting compression resources.', color: 'from-violet-500 to-purple-600', glow: 'rgba(139,92,246,0.3)' },
  { icon: ShieldCheck, title: 'AES-256-GCM Vault', desc: 'Military-grade file protection. Keys never leave the server. Restore-on-download with cryptographic integrity.', color: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.3)' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Real-time storage savings dashboards. Visualize compression ratios, duplicate reduction, and category breakdown.', color: 'from-orange-500 to-amber-500', glow: 'rgba(249,115,22,0.3)' },
]

const modes = [
  {
    name: 'Lossless Vault', tag: 'PRECISION', color: 'cyan', border: 'border-cyan-500/30', bg: 'rgba(6,182,212,0.07)', glow: '0 0 40px rgba(6,182,212,0.2)',
    points: ['Exact byte-perfect restoration', 'Preserve original quality fully', 'Ideal for documents & archives', 'Moderate storage savings'],
  },
  {
    name: 'Smart Shrink', tag: 'MAXIMUM POWER', color: 'violet', border: 'border-violet-500/30', bg: 'rgba(139,92,246,0.07)', glow: '0 0 40px rgba(139,92,246,0.2)',
    points: ['Up to 60% size reduction', 'Near-original visual quality', 'WebP conversion for images', 'Best for large media & old files'],
  },
]

const steps = [
  { n: '01', title: 'Upload Files', desc: 'Drag & drop or browse. Multi-file uploads with real-time progress.', icon: Upload },
  { n: '02', title: 'AI Analyzes', desc: 'Duplicate detection fires instantly. AI recommends optimal compression mode.', icon: Zap },
  { n: '03', title: 'Compress & Protect', desc: 'Real compression happens server-side. Protect sensitive files with AES-256.', icon: Lock },
  { n: '04', title: 'Save & Restore', desc: 'Download compressed files. Restore originals anytime.', icon: TrendingDown },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 overflow-x-hidden">
      <div className="bg-grid fixed inset-0 opacity-25 pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none"><path d="M20 4L36 13V27L20 36L4 27V13L20 4Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" /><circle cx="20" cy="20" r="5" fill="white" /></svg>
            </div>
            <span className="font-bold gradient-text">CompressIQ AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started <ArrowRight size={14} /></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[800px] h-[800px] rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle, rgba(37,99,235,1) 0%, transparent 70%)' }} />
        </div>
        <div className="absolute top-32 right-20 w-64 h-64 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, rgba(139,92,246,1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 left-10 w-48 h-48 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, rgba(6,182,212,1) 0%, transparent 70%)' }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="badge-cyan mb-6 inline-flex text-xs font-bold uppercase tracking-widest">
              <Zap size={10} /> AI-Powered Storage Intelligence · Hackathon 2026
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}
            className="text-6xl md:text-7xl font-black leading-none tracking-tight mb-6"
          >
            <span className="text-slate-100">Your storage,</span>
            <br />
            <span className="gradient-text">intelligently optimized.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            CompressIQ AI automatically detects duplicates, compresses files with AI-guided precision, protects sensitive content, and visualizes your storage savings — all in one premium platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register" className="btn-primary text-base py-4 px-8">
              Start Optimizing Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base py-4 px-8">
              Sign In to Dashboard
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-8 mt-16"
          >
            {[['60%', 'Max Compression'], ['SHA-256', 'Duplicate Detection'], ['AES-256-GCM', 'File Protection'], ['100MB', 'Per File Limit']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black gradient-text-cyan">{val}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-black gradient-text mb-4">Everything you need. Nothing you don't.</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">A complete storage intelligence ecosystem in one polished platform.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="card glass-hover group"
                style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06)` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${f.color} flex-shrink-0`} style={{ boxShadow: `0 0 24px ${f.glow}` }}>
                    <f.icon size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-lg mb-2">{f.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compression Modes */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-100 mb-3">Two Modes. One Platform.</h2>
            <p className="text-slate-400">Choose your compression philosophy — or let AI decide.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8">
            {modes.map((m, i) => (
              <motion.div key={m.name} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }}
                className={`rounded-2xl p-8 border ${m.border}`}
                style={{ background: m.bg, boxShadow: m.glow }}
              >
                <div className="mb-1">
                  <span className={`badge-${m.color} text-[10px] font-black tracking-widest`}>{m.tag}</span>
                </div>
                <h3 className={`text-2xl font-black text-${m.color}-300 mt-3 mb-5`}>{m.name}</h3>
                <ul className="space-y-3">
                  {m.points.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle size={15} className={`text-${m.color}-400 flex-shrink-0`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-black gradient-text mb-3">How It Works</h2>
            <p className="text-slate-400">From upload to optimized in seconds.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} className="card text-center glass-hover">
                <div className="text-5xl font-black text-slate-800 mb-4">{s.n}</div>
                <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                  <s.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="card py-16 relative overflow-hidden"
            style={{ boxShadow: '0 0 80px rgba(37,99,235,0.2)' }}
          >
            <div className="absolute inset-0 opacity-5" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }} />
            <h2 className="text-4xl font-black gradient-text mb-4 relative">Ready to reclaim your storage?</h2>
            <p className="text-slate-400 mb-8 relative">Join the intelligent storage revolution. Free, powerful, and built for scale.</p>
            <Link to="/register" className="btn-primary text-base py-4 px-10 relative">
              Get Started Now <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
              <svg width="14" height="14" viewBox="0 0 40 40" fill="none"><path d="M20 4L36 13V27L20 36L4 27V13L20 4Z" stroke="white" strokeWidth="3" strokeLinejoin="round" /></svg>
            </div>
            <span className="font-bold text-sm gradient-text">CompressIQ AI</span>
          </div>
          <p className="text-slate-600 text-xs">© 2026 CompressIQ AI · Hackathon 2026 · AI / Systems Engineering</p>
        </div>
      </footer>
    </div>
  )
}
