import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFileStore } from '../store/fileStore'
import { ShieldCheck, Download, FileText, Image, Video, Archive, Lock, Unlock, CheckCircle } from 'lucide-react'

function fmt(b: number) {
  if (!b) return '0 B'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return `${(b/k**i).toFixed(1)} ${s[i]}`
}
const typeIcon: Record<string,any> = { image:Image, video:Video, document:FileText, archive:Archive }
const typeColor: Record<string,string> = { image:'text-cyan-400', video:'text-violet-400', document:'text-blue-400', archive:'text-orange-400' }

export default function ProtectionVault() {
  const {
    files,
    fetchFiles,
    unprotectFile,
    downloadCompressed,
    downloadRestored,
    downloadCompressedBulk,
    downloadRestoredBulk,
  } = useFileStore()
  const [acting, setActing] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [restoreStatus, setRestoreStatus] = useState<Record<string, string>>({})

  useEffect(() => { fetchFiles() }, [])

  const protectedFiles = files.filter(f => !f.is_duplicate && f.is_protected)
  const eligible = protectedFiles
  const compressedFiles = files.filter(f => !f.is_duplicate && f.is_compressed)
  const selectedIds = Array.from(selected)

  const unprotect = async (id: string) => {
    setActing(prev => new Set([...prev, id]))
    try { await unprotectFile(id) } catch {}
    setActing(prev => { const s=new Set(prev); s.delete(id); return s })
  }

  const setStage = async (id: string, stage: string) => {
    setRestoreStatus(prev => ({ ...prev, [id]: stage }))
    await new Promise(resolve => setTimeout(resolve, 220))
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const restore = async (id: string, filename: string, protectedFile: boolean) => {
    setActing(prev => new Set([...prev, id]))
    try {
      if (protectedFile) await setStage(id, 'Decrypting...')
      await setStage(id, 'Decompressing...')
      await setStage(id, 'Reconstructing original file...')
      await setStage(id, 'Preparing restored download...')
      await downloadRestored(id, filename, protectedFile)
      setRestoreStatus(prev => ({ ...prev, [id]: 'Completed' }))
    } catch {
      setRestoreStatus(prev => ({ ...prev, [id]: 'Restore failed' }))
    }
    setActing(prev => { const s=new Set(prev); s.delete(id); return s })
  }

  const restoredBulk = async (ids: string[], protectedOnly = true) => {
    const batchId = protectedOnly ? 'protected-bulk' : 'restored-bulk'
    setActing(prev => new Set([...prev, batchId]))
    try { await downloadRestoredBulk(ids, protectedOnly) } catch {}
    setActing(prev => { const s=new Set(prev); s.delete(batchId); return s })
  }

  const compressedBulk = async (ids: string[]) => {
    setActing(prev => new Set([...prev, 'compressed-bulk']))
    try { await downloadCompressedBulk(ids) } catch {}
    setActing(prev => { const s=new Set(prev); s.delete('compressed-bulk'); return s })
  }

  const protectedCount = files.filter(f => f.is_protected).length

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-3xl font-black text-slate-100">Restoration Vault</h1>
        <p className="text-slate-400 mt-1">Files are automatically encrypted and protected. Restore usable originals whenever needed.</p>
      </motion.div>

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="rounded-2xl p-5 border border-emerald-500/20"
        style={{ background:'rgba(16,185,129,0.06)', boxShadow:'0 0 30px rgba(16,185,129,0.1)' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#10b981,#059669)' }}>
            <ShieldCheck size={20} className="text-white"/>
          </div>
          <div>
            <h3 className="font-bold text-emerald-300 mb-1">Protected Automatically During Compression</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Files in the restoration flow are already encrypted server-side using AES-256-GCM. Keys are stored securely and never transmitted to the client.</p>
          </div>
          <div className="ml-auto flex gap-6 text-center flex-shrink-0">
            <div>
              <div className="text-2xl font-black text-emerald-400">{protectedCount}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Restorable</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-header mb-1">Restore Original Files</h2>
          <p className="text-xs text-slate-500">Select the restorable files you want and download reconstructed originals.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSelected(new Set(protectedFiles.map(f => f.id)))} disabled={protectedFiles.length === 0} className="btn-secondary text-xs py-2 px-3">
            Select All Restorable
          </button>
          <button onClick={() => setSelected(new Set())} disabled={selectedIds.length === 0} className="btn-secondary text-xs py-2 px-3">
            Clear Selection
          </button>
          <button onClick={() => restoredBulk(selectedIds, true)} disabled={selectedIds.length === 0 || acting.has('protected-bulk')} className="btn-cyan text-xs py-2 px-3">
            <Download size={13}/> Download Selected Restored Files
          </button>
          <button onClick={() => restoredBulk([], true)} disabled={protectedFiles.length === 0 || acting.has('protected-bulk')} className="btn-secondary text-xs py-2 px-3">
            <Download size={13}/> Download All Restored Files
          </button>
          <button onClick={() => compressedBulk(selectedIds.length ? selectedIds : compressedFiles.map(f => f.id))} disabled={compressedFiles.length === 0 || acting.has('compressed-bulk')} className="btn-secondary text-xs py-2 px-3">
            <Archive size={13}/> Download Compressed Versions
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {eligible.length === 0 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card flex flex-col items-center py-16 text-center">
              <ShieldCheck size={40} className="text-slate-700 mb-3"/>
              <p className="text-slate-500 font-medium">No restorable files to display</p>
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
                    {f.is_protected && (
                      <button onClick={() => toggle(f.id)} className={`absolute -left-2 -top-2 w-5 h-5 rounded-md border flex items-center justify-center z-10 ${selected.has(f.id) ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-slate-600'}`} title="Select for restored download">
                        {selected.has(f.id) && <CheckCircle size={12} className="text-white"/>}
                      </button>
                    )}
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
                      {f.is_protected && <span className="badge-green text-[10px]">Already Protected</span>}
                      {!f.is_protected && <span className="badge-violet text-[10px]">Protected Automatically During Compression</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmt(f.original_size)} - {f.file_type}
                      {f.protected_at && <> - Protected {new Date(f.protected_at).toLocaleDateString()}</>}
                    </div>
                    {restoreStatus[f.id] && (
                      <div className={`text-xs mt-1 ${restoreStatus[f.id] === 'Completed' ? 'text-emerald-400' : restoreStatus[f.id] === 'Restore failed' ? 'text-red-400' : 'text-cyan-400'}`}>
                        {restoreStatus[f.id]}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActing ? (
                      <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"/>
                    ) : f.is_protected ? (
                      <>
                        <button onClick={() => restore(f.id, f.original_filename, true)} className="btn-cyan text-xs py-2 px-3">
                          <Download size={13}/> Download Restored
                        </button>
                        {f.is_compressed && (
                          <button onClick={() => downloadCompressed(f.id, `compressed_${f.original_filename}`)} className="btn-secondary text-xs py-2 px-3">
                            <Archive size={13}/> Compressed
                          </button>
                        )}
                        <button onClick={() => unprotect(f.id)} className="btn-secondary text-xs py-2 px-3">
                          <Unlock size={13}/> Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => restore(f.id, f.original_filename, false)} className="btn-cyan text-xs py-2 px-3">
                          <Download size={13}/> Download Restored
                        </button>
                        <span className="badge-green text-[10px]">Protection Automatic</span>
                      </>
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
