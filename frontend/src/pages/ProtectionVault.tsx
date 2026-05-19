import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFileStore } from '../store/fileStore'
import { ShieldCheck, ShieldOff, Download, FileText, Image, Video, Archive, Lock, Unlock } from 'lucide-react'

function fmt(b: number) {
  if (!b) return '0 B'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return `${(b/k**i).toFixed(1)} ${s[i]}`
}
const typeIcon: Record<string,any> = { image:Image, video:Video, document:FileText, archive:Archive }
const typeColor: Record<string,string> = { image:'text-cyan-400', video:'text-violet-400', document:'text-blue-400', archive:'text-orange-400' }

export default function ProtectionVault() {
  const { files, fetchFiles, protectFile, unprotectFile, restoreProtected } = useFileStore()
  const [acting, setActing] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all'|'protected'|'unprotected'>('all')

  useEffect(() => { fetchFiles() }, [])

  const eligible = files.filter(f => !f.is_duplicate && (filter==='all' ? true : filter==='protected' ? f.is_protected : !f.is_protected))

  const protect = async (id: string) => {
    setActing(prev => new Set([...prev, id]))
    try { await protectFile(id) } catch {}
    setActing(prev => { const s=new Set(prev); s.delete(id); return s })
  }

  const unprotect = async (id: string) => {
    setActing(prev => new Set([...prev, id]))
    try { await unprotectFile(id) } catch {}
    setActing(prev => { const s=new Set(prev); s.delete(id); return s })
  }

  const restore = async (id: string, filename: string) => {
    setActing(prev => new Set([...prev, id]))
    try { await restoreProtected(id, filename) } catch {}
    setActing(prev => { const s=new Set(prev); s.delete(id); return s })
  }

  const protectedCount = files.filter(f => f.is_protected).length
  const unprotectedCount = files.filter(f => !f.is_duplicate && !f.is_protected).length

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-3xl font-black text-slate-100">Protection Vault</h1>
        <p className="text-slate-400 mt-1">AES-256-GCM military-grade encryption. Keys never leave the server.</p>
      </motion.div>

      {/* Info Banner */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="rounded-2xl p-5 border border-emerald-500/20"
        style={{ background:'rgba(16,185,129,0.06)', boxShadow:'0 0 30px rgba(16,185,129,0.1)' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#10b981,#059669)' }}>
            <ShieldCheck size={20} className="text-white"/>
          </div>
          <div>
            <h3 className="font-bold text-emerald-300 mb-1">AES-256-GCM Encryption</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Files are encrypted server-side using AES-256-GCM. Keys are stored securely and never transmitted to the client. Protected files are decrypted only on restore-on-download.</p>
          </div>
          <div className="ml-auto flex gap-6 text-center flex-shrink-0">
            <div>
              <div className="text-2xl font-black text-emerald-400">{protectedCount}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Protected</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-400">{unprotectedCount}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Unprotected</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all','protected','unprotected'] as const).map(f => (
          <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${filter===f?'btn-primary':'btn-secondary'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Files */}
      <div className="space-y-3">
        <AnimatePresence>
          {eligible.length === 0 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card flex flex-col items-center py-16 text-center">
              <ShieldCheck size={40} className="text-slate-700 mb-3"/>
              <p className="text-slate-500 font-medium">No files to display</p>
            </motion.div>
          )}
          {eligible.map((f, i) => {
            const Icon = typeIcon[f.file_type] ?? FileText
            const isActing = acting.has(f.id)
            return (
              <motion.div key={f.id} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                className={`card py-4 px-5 transition-all ${f.is_protected ? 'border-emerald-500/20' : ''}`}
                style={f.is_protected ? { background:'rgba(16,185,129,0.04)' } : {}}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0">
                      <Icon size={17} className={typeColor[f.file_type]??'text-blue-400'}/>
                    </div>
                    {f.is_protected && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Lock size={9} className="text-white"/>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-200 truncate text-sm">{f.original_filename}</span>
                      {f.is_protected && <span className="badge-green text-[10px]">AES-256-GCM Protected</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmt(f.original_size)} · {f.file_type}
                      {f.protected_at && <> · Protected {new Date(f.protected_at).toLocaleDateString()}</>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActing ? (
                      <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"/>
                    ) : f.is_protected ? (
                      <>
                        <button onClick={() => restore(f.id, f.original_filename)} className="btn-cyan text-xs py-2 px-3">
                          <Download size={13}/> Restore
                        </button>
                        <button onClick={() => unprotect(f.id)} className="btn-secondary text-xs py-2 px-3">
                          <Unlock size={13}/> Remove
                        </button>
                      </>
                    ) : (
                      <button onClick={() => protect(f.id)} className="btn-primary text-xs py-2 px-3">
                        <ShieldCheck size={13}/> Protect
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
